#!/usr/bin/env python3
"""Place une empreinte sur un plateau .kicad_pcb (one-shot, API classique pcbnew).

Usage:
  python place_footprint.py --board <path.kicad_pcb> --lib <LibName> \
      --footprint <FootprintName> --reference R1 --value 10k --x 10 --y 10 \
      [--layer F.Cu] [--dry-run]

Sortie stdout : un unique objet JSON (une ligne). stderr : logs/warnings.
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
        description="Place une empreinte sur un plateau .kicad_pcb (API pcbnew classique)."
    )
    parser.add_argument("--board", required=True, help="Chemin du fichier .kicad_pcb")
    parser.add_argument("--lib", required=True, help="Nom de la librairie, ex. Resistor_SMD")
    parser.add_argument("--footprint", required=True, help="Nom de l'empreinte, ex. R_0603_1608Metric")
    parser.add_argument("--reference", required=True, help="Référence, ex. R1")
    parser.add_argument("--value", default="", help="Valeur, ex. 10k (optionnel)")
    parser.add_argument("--x", required=True, type=float, help="Position X en mm")
    parser.add_argument("--y", required=True, type=float, help="Position Y en mm")
    parser.add_argument("--layer", default="F.Cu", help="Couche (défaut F.Cu)")
    parser.add_argument("--dry-run", action="store_true", help="Valide sans écrire")
    args = parser.parse_args()

    try:
        import pcbnew
    except Exception as exc:
        fail(f"module pcbnew indisponible ({exc})")

    board_path = os.path.abspath(args.board)
    if not os.path.isfile(board_path):
        fail(f"plateau introuvable: {board_path}")

    lib_path = os.path.join(find_kicad_share(), "footprints", f"{args.lib}.pretty")
    if not os.path.isdir(lib_path):
        fail(f"librairie introuvable: {lib_path}")

    try:
        board = pcbnew.LoadBoard(board_path)
    except Exception as exc:
        fail(f"chargement impossible: {exc}")

    try:
        fp = pcbnew.FootprintLoad(lib_path, args.footprint)
    except Exception as exc:
        fail(f"FootprintLoad echoue: {exc}")
    if fp is None:
        fail(f"empreinte introuvable: {args.lib}:{args.footprint}")

    try:
        fp.SetReference(args.reference)
        fp.SetValue(args.value or "")
        fp.SetPosition(pcbnew.VECTOR2I(int(args.x * 1_000_000), int(args.y * 1_000_000)))
        layer_id = resolve_layer(board, args.layer)
        if layer_id is not None:
            fp.SetLayer(layer_id)
    except Exception as exc:
        fail(f"proprietes de l'empreinte: {exc}")

    try:
        board.Add(fp)
    except Exception as exc:
        fail(f"ajout au plateau: {exc}")

    if args.dry_run:
        emit(
            {
                "ok": True,
                "wouldPlace": True,
                "message": f"dry-run ok: {args.reference}",
                "footprintCount": len(list(board.GetFootprints())),
            }
        )

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

    try:
        board2 = pcbnew.LoadBoard(board_path)
        count = len(list(board2.GetFootprints()))
        refs = [f.GetReference() for f in board2.GetFootprints()]
    except Exception as exc:
        fail(f"relecture impossible: {exc}")

    if args.reference not in refs:
        fail(f"verification echouee: {args.reference} absent apres relecture")

    emit({"ok": True, "message": f"placed {args.reference}", "footprintCount": count})


if __name__ == "__main__":
    main()