#!/usr/bin/env python3
"""Place une empreinte sur un plateau .kicad_pcb (one-shot, API classique pcbnew).

Usage:
  python place_footprint.py --board <path.kicad_pcb> --lib <LibName> \
      --footprint <FootprintName> --reference R1 --value 10k --x 10 --y 10 \
      [--layer F.Cu] [--dry-run] [--force] [--allow-outside]

Options :
  --dry-run        Valide sans écrire (aucun .bak, aucune réconciliation)
  --force          Ignore le verrou KiCad
  --allow-outside  Ignore le contrôle géométrique (hors plateau)

Sortie stdout : {"ok": true, "placed": 1, "verified": 1, "board": "<path>", "backup": "<path>"}
             ou {"ok": false, "error": "<message>"} + exit 1
"""

import argparse
import json
import os
import shutil
import sys

TOLERANCE_NM = 10_000
ROTATION_TOLERANCE_DEG = 0.5


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


def find_lock(board_path):
    board_dir = os.path.dirname(board_path) or "."
    base = os.path.basename(board_path)
    try:
        for entry in os.listdir(board_dir):
            if base in entry and entry.endswith(".lck"):
                return entry
    except Exception:
        return None
    return None


def normalize_rotation(deg):
    return ((deg % 360) + 360) % 360


def rotation_delta(a, b):
    diff = abs(normalize_rotation(a) - normalize_rotation(b))
    return 360 - diff if diff > 180 else diff


def restore(backup_path, board_path):
    try:
        shutil.copy2(backup_path, board_path)
    except Exception:
        pass


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
    parser.add_argument("--force", action="store_true", help="Ignore le verrou KiCad")
    parser.add_argument("--allow-outside", action="store_true", help="Ignore le contrôle géométrique")
    args = parser.parse_args()

    try:
        import pcbnew
    except Exception as exc:
        fail(f"module pcbnew indisponible ({exc})")

    board_path = os.path.abspath(args.board)
    if not os.path.isfile(board_path):
        fail(f"plateau introuvable: {board_path}")

    if not args.force:
        lock = find_lock(board_path)
        if lock:
            fail(f"Plateau probablement ouvert dans KiCad (verrou: {lock}). Fermez-le ou utilisez --force.")

    lib_path = os.path.join(find_kicad_share(), "footprints", f"{args.lib}.pretty")
    if not os.path.isdir(lib_path):
        fail(f"librairie introuvable: {lib_path}")

    try:
        board = pcbnew.LoadBoard(board_path)
    except Exception as exc:
        fail(f"chargement impossible: {exc}")

    # Contrôle géométrique
    if not args.allow_outside:
        bbox = None
        try:
            bbox = board.GetBoardEdgesBoundingBox()
        except Exception as exc:
            print(f"warning: bbox indisponible ({exc})", file=sys.stderr)

        if bbox is not None and bbox.GetWidth() > 0 and bbox.GetHeight() > 0:
            x_nm = int(args.x * 1_000_000)
            y_nm = int(args.y * 1_000_000)
            if not (bbox.GetX() <= x_nm <= bbox.GetRight() and bbox.GetY() <= y_nm <= bbox.GetBottom()):
                fail(f"{args.reference} hors du plateau (x={args.x} mm, y={args.y} mm)")
        else:
            print("warning: bbox vide, contrôle géométrique ignoré", file=sys.stderr)

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
        emit({"ok": True, "wouldPlace": True, "placed": 1, "board": board_path})

    backup_path = board_path + ".bak"
    try:
        shutil.copy2(board_path, backup_path)
    except Exception as exc:
        fail(f"sauvegarde de securite impossible: {exc}")

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
        found = None
        for candidate in board2.GetFootprints():
            if candidate.GetReference() == args.reference:
                found = candidate
                break
    except Exception as exc:
        restore(backup_path, board_path)
        fail(f"relecture impossible: {exc} — plateau restaure depuis .bak")

    if found is None:
        restore(backup_path, board_path)
        fail(f"Reconciliation echouee pour {args.reference} (absent) — plateau restaure depuis .bak")

    position = found.GetPosition()
    expected_x = int(args.x * 1_000_000)
    expected_y = int(args.y * 1_000_000)

    if abs(position.x - expected_x) > TOLERANCE_NM or abs(position.y - expected_y) > TOLERANCE_NM:
        restore(backup_path, board_path)
        fail(
            f"Reconciliation echouee pour {args.reference} "
            f"(attendu x={expected_x} y={expected_y}, obtenu x={position.x} y={position.y}) "
            f"— plateau restaure depuis .bak"
        )

    emit(
        {
            "ok": True,
            "placed": 1,
            "verified": 1,
            "board": board_path,
            "backup": backup_path,
        }
    )


if __name__ == "__main__":
    main()