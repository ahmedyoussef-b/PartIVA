#!/usr/bin/env python3
"""Routage assisté PARTIEL : pistes en L pour les nets à 2 pins + zone GND.

SQUELETTE — non câblé dans l'application pour l'instant.

Usage :
  python route_board.py --board <path.kicad_pcb> --nets <nets.json> [--dry-run] [--force]

nets.json : [{"name": "VCC_5V", "pins": ["U1.1", "C1.1"]}, ...]

Limites connues (volontaires pour v1) :
  - aucun DRC, aucune vérification de croisement entre pistes ;
  - les nets à plus de 2 pins sont ignorés (hors GND) ;
  - une seule couche de signal (F.Cu) pour les pistes, GND en zone B.Cu.

Sortie stdout : {"ok": true, "tracks": N, "zones": N} ou {"ok": false, "error": "..."}
"""

import argparse
import json
import os
import shutil
import sys

TOLERANCE_NM = 10_000
TRACK_WIDTH_MM = 0.25
CLEARANCE_MM = 0.3


def emit(payload, code=0):
    sys.stdout.write("\n" + json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()
    sys.exit(code)


def fail(message, code=1):
    emit({"ok": False, "error": message}, code)


def find_kicad_share():
    env = os.environ.get("PARTIVA_KICAD_SHARE")
    if env:
        return os.path.abspath(env)
    return os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(sys.executable)), "..", "share", "kicad"))


def parse_pin(pin):
    """'U1.3' -> ('U1', '3')."""
    text = str(pin).strip()
    if "." not in text:
        return None
    ref, number = text.rsplit(".", 1)
    if not ref or not number:
        return None
    return ref, number


def is_gnd(name):
    lowered = str(name).lower()
    return any(token in lowered for token in ("gnd", "vss", "0v"))


def add_l_route(board, start, end, layer_id, width_nm):
    """Deux segments orthogonaux : horizontal puis vertical."""
    corner = board.GetLayerID(layer_id) if isinstance(layer_id, str) else layer_id
    tracks = []
    for a, b in (
        ((start.x, start.y), (end.x, start.y)),
        ((end.x, start.y), (end.x, end.y)),
    ):
        if a == b:
            continue
        segment = pcbnew.PCB_TRACK(board)
        segment.SetStart(pcbnew.VECTOR2I(int(a[0]), int(a[1])))
        segment.SetEnd(pcbnew.VECTOR2I(int(b[0]), int(b[1])))
        segment.SetWidth(int(width_nm))
        segment.SetLayer(corner)
        board.Add(segment)
        tracks.append(segment)
    return tracks


def add_gnd_zone(board):
    """Zone de cuivre B.Cu couvrant l'intérieur du contour Edge.Cuts."""
    zone = pcbnew.ZONE(board)
    zone.SetLayer(board.GetLayerID("B.Cu"))
    zone.SetLocalClearance(int(CLEARANCE_MM * 1_000_000))
    outline = zone.Outline()
    outline.NewOutline()
    bbox = board.GetBoardEdgesBoundingBox()
    inset = int(CLEARANCE_MM * 1_000_000)
    points = [
        (bbox.GetX() + inset, bbox.GetY() + inset),
        (bbox.GetRight() - inset, bbox.GetY() + inset),
        (bbox.GetRight() - inset, bbox.GetBottom() - inset),
        (bbox.GetX() + inset, bbox.GetBottom() - inset),
    ]
    for x, y in points:
        outline.Append(int(x), int(y))
    board.Add(zone)
    return zone


def main():
    parser = argparse.ArgumentParser(description="Routage assisté partiel (pistes L + zone GND)")
    parser.add_argument("--board", required=True)
    parser.add_argument("--nets", required=True)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    try:
        import pcbnew
    except Exception as exc:
        fail(f"module pcbnew indisponible ({exc})")

    board_path = os.path.abspath(args.board)
    if not os.path.isfile(board_path):
        fail(f"plateau introuvable: {board_path}")

    with open(os.path.abspath(args.nets), "r", encoding="utf-8") as fh:
        nets = json.load(fh)
    if not isinstance(nets, list):
        fail("nets : tableau attendu")

    try:
        board = pcbnew.LoadBoard(board_path)
    except Exception as exc:
        fail(f"chargement impossible: {exc}")

    # Anti-SWIG : capturer les empreintes AVANT toute mutation du board.
    footprints = {}
    try:
        for fp in board.GetFootprints():
            footprints[fp.GetReference()] = fp
    except Exception as exc:
        fail(f"lecture des empreintes impossible: {exc}")

    created = 0
    zones = 0
    for net in nets:
        if not isinstance(net, dict):
            continue
        name = str(net.get("name") or "").strip()
        pins = net.get("pins") or []
        if not name or not isinstance(pins, list):
            continue
        if is_gnd(name):
            if not args.dry_run:
                try:
                    add_gnd_zone(board)
                    zones += 1
                except Exception as exc:
                    print(f"warning: zone GND impossible ({exc})", file=sys.stderr)
            continue
        if len(pins) != 2:
            continue
        endpoints = []
        for pin in pins:
            parsed = parse_pin(pin)
            if not parsed:
                break
            ref, number = parsed
            fp = footprints.get(ref)
            if fp is None:
                break
            pad = next((p for p in fp.Pads() if p.GetNumber() == number), None)
            if pad is None:
                break
            endpoints.append(pad.GetPosition())
        if len(endpoints) != 2:
            print(f"warning: pins introuvables pour {name}", file=sys.stderr)
            continue
        if not args.dry_run:
            try:
                created += len(
                    add_l_route(board, endpoints[0], endpoints[1], "F.Cu", TRACK_WIDTH_MM * 1_000_000)
                )
            except Exception as exc:
                print(f"warning: piste impossible pour {name} ({exc})", file=sys.stderr)

    if args.dry_run:
        emit({"ok": True, "wouldRoute": created, "wouldZone": zones})

    backup = board_path + ".bak"
    try:
        shutil.copy2(board_path, backup)
        tmp = board_path + ".tmp"
        pcbnew.SaveBoard(tmp, board)
        os.replace(tmp, board_path)
    except Exception as exc:
        fail(f"sauvegarde impossible: {exc}")

    emit({"ok": True, "tracks": created, "zones": zones, "board": board_path, "backup": backup})


if __name__ == "__main__":
    main()
