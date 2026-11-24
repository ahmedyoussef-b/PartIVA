#!/usr/bin/env python3
"""Synchronisation live d'un plateau KiCad ouvert via l'API IPC (kicad-python).

Contrairement au script `place_footprints.py` qui réécrit le fichier depuis un
processus séparé (et se heurte au verrou `.lck` de l'éditeur ouvert), ce script
parle directement à l'instance KiCad en cours : les déplacements apparaissent
immédiatement dans la fenêtre. Il ne sauvegarde jamais le plateau : la
persistance est faite au préalable par `place_footprints.py`, sinon l'état
mémoire de KiCad écraserait les composants ajoutés depuis son ouverture.

Entrée : un fichier JSON contenant un tableau de composants :
    [{"reference": "C3", "xMm": 91.5, "yMm": 118.7, "rotation": 0}]

Sortie : un JSON sur stdout avec `ok`, `moved`, `missing`, `board`, `live`.
Codes de sortie : 0 = OK, 2 = IPC/plateau indisponible, 1 = autre erreur.
"""

import argparse
import json
import os
import sys
import traceback


def patch_reference_point():
    """kicad-python 0.8.0 ne connaît pas `ReferencePoint` ajouté par KiCad 10.0.8.

    On enregistre un message protobuf minimal pour ce type afin que le
    désemballage des empreintes ne plante pas. Le contenu n'est pas utilisé.
    """
    try:
        from google.protobuf import descriptor_pb2, descriptor_pool, message_factory
        from kipy.util import proto as kproto
        import kipy.board_types as board_types

        url = "type.googleapis.com/kiapi.board.types.ReferencePoint"
        if url in kproto._any_urls:
            return

        fd = descriptor_pb2.FileDescriptorProto()
        fd.name = "partiva_reference_point.proto"
        fd.package = "kiapi.board.types"
        msg = fd.message_type.add()
        msg.name = "ReferencePoint"
        pool = descriptor_pool.DescriptorPool()
        pool.Add(fd)
        ref_type = message_factory.GetMessageClass(
            pool.FindMessageTypeByName("kiapi.board.types.ReferencePoint")
        )
        kproto._any_urls[url] = ref_type

        if ref_type not in board_types._proto_to_object:
            class _OpaqueReferencePoint:
                def __init__(self, proto):
                    self._proto = proto

            board_types._proto_to_object[ref_type] = _OpaqueReferencePoint
    except Exception:
        # Sur une version de kicad-python qui gère déjà le type, on continue.
        pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--board", required=True, help="Chemin du fichier .kicad_pcb attendu")
    parser.add_argument("--input", required=True, help="Fichier JSON des déplacements")
    parser.add_argument("--dry-run", action="store_true", help="Valider sans sauvegarder")
    args = parser.parse_args()

    patch_reference_point()

    try:
        from kipy import KiCad
        from kipy.geometry import Angle, Vector2
    except Exception as exc:
        print(json.dumps({"ok": False, "code": "KIPY_UNAVAILABLE", "error": str(exc)}))
        return 2

    try:
        with open(args.input, "r", encoding="utf-8") as fh:
            items = json.load(fh)
        if not isinstance(items, list):
            raise ValueError("JSON d'entrée : tableau attendu")
    except Exception as exc:
        print(json.dumps({"ok": False, "code": "BAD_INPUT", "error": str(exc)}))
        return 1

    try:
        kicad = KiCad()
    except Exception as exc:
        print(json.dumps({"ok": False, "code": "IPC_UNAVAILABLE", "error": str(exc)}))
        return 2

    try:
        board = kicad.get_board()
    except Exception as exc:
        print(json.dumps({"ok": False, "code": "BOARD_UNAVAILABLE", "error": str(exc)}))
        return 2

    if board is None:
        print(json.dumps({"ok": False, "code": "NO_BOARD_OPEN", "error": "Aucun plateau ouvert dans KiCad"}))
        return 2

    board_filename = ""
    board_dir = ""
    try:
        board_filename = board.document.board_filename or ""
        board_dir = board.document.project.path or ""
    except Exception:
        pass
    # Comparaison sur le chemin COMPLET : deux projets peuvent avoir le même
    # nom de fichier (`carte-test.kicad_pcb`) dans des dossiers différents.
    expected = os.path.abspath(args.board.replace("\\", "/"))
    opened = os.path.abspath(os.path.join(board_dir.replace("\\", "/"), board_filename.replace("\\", "/")))
    if board_filename and opened.lower() != expected.lower():
        print(json.dumps({
            "ok": False,
            "code": "BOARD_MISMATCH",
            "error": f"KiCad a ouvert {opened!r}, attendu {expected!r}",
            "board": opened,
        }))
        return 2

    try:
        footprints = board.get_footprints()
        by_ref = {}
        for fp in footprints:
            try:
                ref = fp.reference_field.text.value
            except Exception:
                continue
            if ref:
                by_ref[ref] = fp

        missing = [str(item.get("reference", "")).strip() for item in items
                   if str(item.get("reference", "")).strip() not in by_ref]
        if missing:
            # Le live sync ne sait que DÉPLACER des empreintes existantes.
            # Pour des composants encore absents, l'appelant doit retomber sur
            # le script d'écriture fichier qui sait les AJOUTER au plateau.
            print(json.dumps({
                "ok": False,
                "code": "MISSING_FOOTPRINTS",
                "error": f"Empreintes absentes du plateau ouvert : {', '.join(missing)}",
                "missing": missing,
                "board": board_filename,
            }))
            return 2

        changed = []
        moved = []
        for item in items:
            ref = str(item.get("reference", "")).strip()
            fp = by_ref[ref]
            x_mm = float(item["xMm"])
            y_mm = float(item["yMm"])
            fp.position = Vector2.from_xy_mm(x_mm, y_mm)
            rotation = item.get("rotation")
            if rotation is not None:
                fp.orientation = Angle.from_degrees(float(rotation))
            changed.append(fp)
            moved.append(ref)

        # On ne sauvegarde PAS depuis KiCad : son état en mémoire peut être plus
        # ancien que le fichier (des composants ajoutés entre-temps par le script
        # d'écriture fichier disparaîtraient). La persistance est toujours faite
        # par place_footprints.py avant cet appel ; ici on ne rafraîchit que
        # l'affichage de l'éditeur.
        if changed:
            board.update_items(changed)

        print(json.dumps({
            "ok": True,
            "live": True,
            "moved": moved,
            "missing": missing,
            "board": board_filename,
            "saved": False,
            "dryRun": args.dry_run,
        }))
        return 0
    except Exception as exc:
        print(json.dumps({
            "ok": False,
            "code": "SYNC_FAILED",
            "error": str(exc),
            "trace": traceback.format_exc()[-500:],
        }))
        return 1


if __name__ == "__main__":
    sys.exit(main())
