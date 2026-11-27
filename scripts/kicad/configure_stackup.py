#!/usr/bin/env python3
"""Configure le nombre de couches cuivre d'un plateau (.kicad_pcb).

Usage :
  python configure_stackup.py --board <path> --layers 2|4 [--dry-run]

Sortie stdout : {"ok": true, "layers": 4, "board": "...", "backup": "..."}
"""

import argparse
import json
import os
import shutil
import sys

try:
    import pcbnew
except Exception as exc:
    pcbnew = None
    PCBNEW_ERROR = exc


def emit(payload, code=0):
    sys.stdout.write("\n" + json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()
    sys.exit(code)


def fail(message, code=1):
    emit({"ok": False, "error": message}, code)


def main():
    parser = argparse.ArgumentParser(description="Configuration du stackup cuivre")
    parser.add_argument("--board", required=True)
    parser.add_argument("--layers", type=int, choices=[2, 4], required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if pcbnew is None:
        fail(f"module pcbnew indisponible ({PCBNEW_ERROR})")

    board_path = os.path.abspath(args.board)
    if not os.path.isfile(board_path):
        fail(f"plateau introuvable: {board_path}")

    try:
        board = pcbnew.LoadBoard(board_path)
        previous = board.GetCopperLayerCount()
        board.SetCopperLayerCount(args.layers)
        names = [
            board.GetLayerName(pcbnew.F_Cu),
            board.GetLayerName(pcbnew.In1_Cu),
            board.GetLayerName(pcbnew.In2_Cu),
            board.GetLayerName(pcbnew.B_Cu),
        ]
    except Exception as exc:
        fail(f"configuration impossible: {exc}")

    if args.dry_run:
        emit({"ok": True, "wouldSet": args.layers, "previous": previous, "names": names})

    backup = board_path + ".bak"
    tmp = board_path + ".tmp"
    try:
        shutil.copy2(board_path, backup)
        pcbnew.SaveBoard(tmp, board)
        os.replace(tmp, board_path)
    except Exception as exc:
        try:
            if os.path.exists(tmp):
                os.remove(tmp)
        except Exception:
            pass
        fail(f"sauvegarde impossible: {exc}")

    emit({
        "ok": True,
        "layers": args.layers,
        "previous": previous,
        "names": names,
        "board": board_path,
        "backup": backup,
    })


if __name__ == "__main__":
    main()
