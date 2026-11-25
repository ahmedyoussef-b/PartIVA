#!/usr/bin/env python3
"""Pont Specctra KiCad 10 : export DSN complet et import SES.

Usage :
  python specctra.py export-dsn --board <path.kicad_pcb> --output <path.dsn>
  python specctra.py import-ses --board <path.kicad_pcb> --ses <path.ses>

Sortie stdout JSON : {"ok": true, ...} ou {"ok": false, "error": "..."}
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


def load_board(path):
    try:
        return pcbnew.LoadBoard(path)
    except Exception as exc:
        fail(f"chargement impossible: {exc}")


def export_dsn(args):
    board_path = os.path.abspath(args.board)
    output = os.path.abspath(args.output)
    if not os.path.isfile(board_path):
        fail(f"plateau introuvable: {board_path}")
    board = load_board(board_path)
    try:
        if not pcbnew.ExportSpecctraDSN(board, output):
            fail("ExportSpecctraDSN a échoué")
    except Exception as exc:
        fail(f"export DSN impossible: {exc}")
    if not os.path.isfile(output):
        fail("fichier DSN non produit")
    emit({"ok": True, "dsn": output, "bytes": os.path.getsize(output)})


def import_ses(args):
    board_path = os.path.abspath(args.board)
    ses_path = os.path.abspath(args.ses)
    if not os.path.isfile(board_path):
        fail(f"plateau introuvable: {board_path}")
    if not os.path.isfile(ses_path):
        fail(f"fichier SES introuvable: {ses_path}")
    board = load_board(board_path)
    try:
        if not pcbnew.ImportSpecctraSES(board, ses_path):
            fail("ImportSpecctraSES a échoué")
    except Exception as exc:
        fail(f"import SES impossible: {exc}")
    tracks = len(list(board.GetTracks()))
    backup = board_path + ".bak"
    tmp = board_path + ".tmp"
    try:
        shutil.copy2(board_path, backup)
        pcbnew.SaveBoard(tmp, board)
        os.replace(tmp, board_path)
    except Exception as exc:
        fail(f"sauvegarde impossible: {exc}")
    emit({"ok": True, "tracks": tracks, "board": board_path, "backup": backup})


def main():
    parser = argparse.ArgumentParser(description="Export DSN / import SES Specctra (KiCad 10)")
    sub = parser.add_subparsers(dest="command", required=True)
    p_export = sub.add_parser("export-dsn")
    p_export.add_argument("--board", required=True)
    p_export.add_argument("--output", required=True)
    p_import = sub.add_parser("import-ses")
    p_import.add_argument("--board", required=True)
    p_import.add_argument("--ses", required=True)
    args = parser.parse_args()
    if pcbnew is None:
        fail(f"module pcbnew indisponible ({PCBNEW_ERROR})")
    if args.command == "export-dsn":
        export_dsn(args)
    else:
        import_ses(args)


if __name__ == "__main__":
    main()
