#!/usr/bin/env python3
"""Place N empreintes sur un plateau .kicad_pcb en une seule transaction (API classique pcbnew).

Usage:
  python place_footprints.py --board <path.kicad_pcb> --input <items.json> [--dry-run]

JSON d'entrée (tableau) :
  [ { "libName": "Resistor_SMD", "footprintName": "R_0603_1608Metric",
      "reference": "R1", "value": "10k", "xMm": 10.0, "yMm": 10.0,
      "layer": "F.Cu", "rotation": 0 }, ... ]

Sortie stdout : {"ok": true, "placed": N, "board": "<path>"}
             ou {"ok": false, "error": "<message>"} + exit 1
"""

import argparse
import json
import os
import sys


def emit(payload, code=0):
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()
    sys.exit(code)


def fail(message, code=1):
    emit({"ok": False, "error": message}, code)


def find_kicad_share():
    env = os.environ.get("PARTIVA_KICAD_SHARE")
    if env:
        return os.path.abspath(env)
    exe_dir = os.path.dirname(os.path.abspath(sys.executable))
    return os.path.abspath(os.path.join(exe_dir, "..", "share", "kicad"))


def resolve_layer(board, name):
    if not name:
        return None
    try:
        return board.GetLayerID(name)
    except Exception:
        return None


def main():
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    parser = argparse.ArgumentParser(
        description="Place N empreintes sur un plateau .kicad_pcb (batch, API pcbnew classique)."
    )
    parser.add_argument("--board", required=True, help="Chemin du fichier .kicad_pcb")
    parser.add_argument("--input", required=True, help="Chemin du fichier JSON (tableau d'empreintes)")
    parser.add_argument("--dry-run", action="store_true", help="Valide sans écrire")
    args = parser.parse_args()

    try:
        import pcbnew
    except Exception as exc:
        fail(f"module pcbnew indisponible ({exc})")

    board_path = os.path.abspath(args.board)
    if not os.path.isfile(board_path):
        fail(f"plateau introuvable: {board_path}")

    input_path = os.path.abspath(args.input)
    try:
        with open(input_path, "r", encoding="utf-8") as fh:
            items = json.load(fh)
    except Exception as exc:
        fail(f"lecture JSON impossible: {exc}")

    if not isinstance(items, list):
        fail("JSON d'entrée : tableau attendu")
    if len(items) == 0:
        fail("JSON d'entrée : tableau vide")

    share = find_kicad_share()

    try:
        board = pcbnew.LoadBoard(board_path)
    except Exception as exc:
        fail(f"chargement impossible: {exc}")

    # Phase 1 : tout construire en mémoire. Une erreur = échec global, AUCUNE sauvegarde.
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            fail(f"items[{index}] : objet attendu")

        lib_name = item.get("libName")
        fp_name = item.get("footprintName")
        reference = item.get("reference")
        if not lib_name or not fp_name or not reference:
            fail(f"items[{index}] : libName, footprintName et reference requis")

        lib_path = os.path.join(share, "footprints", f"{lib_name}.pretty")
        if not os.path.isdir(lib_path):
            fail(f"items[{index}] : librairie introuvable: {lib_path}")

        try:
            fp = pcbnew.FootprintLoad(lib_path, fp_name)
        except Exception as exc:
            fail(f"items[{index}] : FootprintLoad echoue: {exc}")
        if fp is None:
            fail(f"items[{index}] : empreinte introuvable: {lib_name}:{fp_name}")

        try:
            fp.SetReference(reference)
            fp.SetValue(item.get("value") or "")
            x_mm = float(item.get("xMm", 0) or 0)
            y_mm = float(item.get("yMm", 0) or 0)
            fp.SetPosition(pcbnew.VECTOR2I(int(x_mm * 1_000_000), int(y_mm * 1_000_000)))
            rotation = float(item.get("rotation") or 0)
            if rotation:
                fp.SetOrientationDegrees(rotation)
            layer_id = resolve_layer(board, item.get("layer"))
            if layer_id is not None:
                fp.SetLayer(layer_id)
        except Exception as exc:
            fail(f"items[{index}] : proprietes de l'empreinte: {exc}")

        try:
            board.Add(fp)
        except Exception as exc:
            fail(f"items[{index}] : ajout au plateau: {exc}")

    if args.dry_run:
        emit({"ok": True, "wouldPlace": True, "placed": len(items), "board": board_path})

    tmp_path = board_path + ".tmp"
    try:
        pcbnew.SaveBoard(tmp_path, board)
        os.replace(tmp_path, board_path)
    except Exception as exc:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass
        fail(f"sauvegarde impossible: {exc}")

    emit({"ok": True, "placed": len(items), "board": board_path})


if __name__ == "__main__":
    main()