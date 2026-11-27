#!/usr/bin/env python3
"""Routage assisté PARTIEL : nets en arbre sur F.Cu + zone GND B.Cu avec vias.

Squelette finalisé (PR "routage assisté partiel"). Ne garantit ni le DRC ni
l'absence de croisement : les nets non présents dans la BDD ne sont pas routés.

Usage :
  python route_board.py --board <path.kicad_pcb> --nets <nets.json> [--dry-run] [--force]

nets.json : [{"name": "GND", "pins": ["U1.2", "C1.2", "U2.16"]}, ...]

Sortie stdout : {"ok": true, "routed": N, "zones": Z, "vias": V}
             ou {"ok": false, "error": "..."}
"""

import argparse
import json
import os
import shutil
import sys

from net_assign import assign_nets

try:
    import pcbnew
except Exception as exc:  # module absent (hors environnement KiCad)
    pcbnew = None
    PCBNEW_IMPORT_ERROR = exc

TRACK_WIDTH_MM = 0.25
VIA_WIDTH_MM = 0.6
VIA_DRILL_MM = 0.3
CLEARANCE_MM = 0.3
ROUTE_CLEARANCE_MM = 0.5
EDGE_INSET_MM = 0.5


def emit(payload, code=0):
    sys.stdout.write("\n" + json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()
    sys.exit(code)


def fail(message, code=1):
    emit({"ok": False, "error": message}, code)


def parse_pin(pin):
    """'U1.3' -> ('U1', '3')."""
    text = str(pin).strip()
    if "." not in text:
        return None
    ref, number = text.rsplit(".", 1)
    return (ref, number) if ref and number else None


def is_gnd(name):
    lowered = str(name).lower()
    return any(token in lowered for token in ("gnd", "vss", "0v"))


def ensure_nets(board, nets):
    """Crée les NETINFO_ITEM manquants dans le board (sinon pistes sur net 0)."""
    created = []
    for net in nets:
        name = str(net.get("name") or "").strip()
        if not name:
            continue
        if board.FindNet(name) is None:
            item = pcbnew.NETINFO_ITEM(board, name)
            board.Add(item)
            created.append(name)
    return created


def capture_pads(board):
    """Anti-SWIG : capturer empreintes + pads AVANT toute mutation du board.

    Chaque entrée : (x, y, demi-largeur, demi-hauteur, code net).
    """
    result = {}
    try:
        for fp in board.GetFootprints():
            pads = {}
            for pad in fp.Pads():
                size = pad.GetSize()
                half_w = max(1, size.x // 2)
                half_h = max(1, size.y // 2)
                pads[pad.GetNumber()] = {
                    "pos": pad.GetPosition(),
                    "half_w": half_w,
                    "half_h": half_h,
                    "net": pad.GetNetCode(),
                }
            result[fp.GetReference()] = pads
    except Exception as exc:
        fail(f"lecture des pads impossível: {exc}")
    return result


def is_segment_clear(x1, y1, x2, y2, obstacles, clearance_nm):
    """Vrai si aucun pad étranger n'est à moins de clearance_nm du segment."""
    xmin, xmax = min(x1, x2), max(x1, x2)
    ymin, ymax = min(y1, y2), max(y1, y2)
    margin = clearance_nm + TRACK_WIDTH_MM * 500_000
    for info in obstacles:
        px, py = info["pos"].x, info["pos"].y
        if xmin - info["half_w"] - margin <= px <= xmax + info["half_w"] + margin and \
           ymin - info["half_h"] - margin <= py <= ymax + info["half_h"] + margin:
            # distance approximative du point au segment (axe dominant)
            if x1 == x2:
                if xmin - info["half_w"] - margin <= px <= xmax + info["half_w"] + margin:
                    return False
            elif y1 == y2:
                if ymin - info["half_h"] - margin <= py <= ymax + info["half_h"] + margin:
                    return False
    return True


def find_safe_lane(pads_by_ref, net_code, x1, y1, x2, y2, clearance_nm):
    """Choisit un couloir Y tel que les 3 segments du chemin L soient dégagés."""
    obstacles = [
        info
        for pads in pads_by_ref.values()
        for info in pads.values()
        if info["net"] != net_code
    ]
    candidates = [y1]
    for info in obstacles:
        limit = info["half_h"] + clearance_nm + TRACK_WIDTH_MM * 500_000
        candidates.extend([info["pos"].y - limit, info["pos"].y + limit])
    for lane in candidates:
        if (
            is_segment_clear(x1, y1, x1, lane, obstacles, clearance_nm)
            and is_segment_clear(x1, lane, x2, lane, obstacles, clearance_nm)
            and is_segment_clear(x2, lane, x2, y2, obstacles, clearance_nm)
        ):
            return True, int(lane)
    return False, int(y1)


def clear_routing(board):
    """Idempotence : retire pistes, vias et zones existants, garde les empreintes."""
    removed = {"tracks": 0, "vias": 0, "zones": 0}
    for track in list(board.GetTracks()):
        try:
            board.Remove(track)
            removed["tracks" if not isinstance(track, pcbnew.PCB_VIA) else "vias"] += 1
        except Exception:
            pass
    for zone in list(board.Zones()):
        try:
            board.Delete(zone)
            removed["zones"] += 1
        except Exception:
            try:
                board.Remove(zone)
                removed["zones"] += 1
            except Exception:
                pass
    return removed


def add_l_segment(board, net, start, end, layer_id, pads_by_ref=None, board_bbox=None):
    """Segment Manhattan avec contournement des pads d'un autre net."""
    created = 0
    x1, y1 = start.x, start.y
    x2, y2 = end.x, end.y
    lane = y1
    if pads_by_ref is not None:
        ok, candidate = find_safe_lane(
            pads_by_ref,
            net.GetNetCode(),
            x1,
            y1,
            x2,
            y2,
            int(ROUTE_CLEARANCE_MM * 1_000_000),
        )
        if ok:
            lane = candidate
        if board_bbox is not None:
            lane = max(board_bbox.GetY() + 500_000, min(board_bbox.GetBottom() - 500_000, lane))

    def segment(a, b):
        nonlocal created
        if a == b:
            return
        track = pcbnew.PCB_TRACK(board)
        track.SetStart(pcbnew.VECTOR2I(int(a[0]), int(a[1])))
        track.SetEnd(pcbnew.VECTOR2I(int(b[0]), int(b[1])))
        track.SetWidth(int(TRACK_WIDTH_MM * 1_000_000))
        track.SetLayer(layer_id)
        track.SetNet(net)
        board.Add(track)
        created += 1

    # ecartement vertical depuis le pad source, couloir horizontal, retour vers la cible
    segment((x1, y1), (x1, lane))
    segment((x1, lane), (x2, lane))
    segment((x2, lane), (x2, y2))
    return created


def add_gnd_zone(board, net):
    # Réutilise une zone GND existante si le nettoyage SWIG n'a pas pu la retirer.
    for existing in list(board.Zones()):
        try:
            if existing.GetNetCode() == net.GetNetCode():
                return existing
        except Exception:
            pass
    zone = pcbnew.ZONE(board)
    zone.SetLayer(board.GetLayerID("B.Cu"))
    zone.SetNet(net)
    zone.SetLocalClearance(int(CLEARANCE_MM * 1_000_000))
    outline = zone.Outline()
    outline.NewOutline()
    bbox = board.GetBoardEdgesBoundingBox()
    inset = int(EDGE_INSET_MM * 1_000_000)
    for x, y in (
        (bbox.GetX() + inset, bbox.GetY() + inset),
        (bbox.GetRight() - inset, bbox.GetY() + inset),
        (bbox.GetRight() - inset, bbox.GetBottom() - inset),
        (bbox.GetX() + inset, bbox.GetBottom() - inset),
    ):
        outline.Append(int(x), int(y))
    board.Add(zone)
    # Remplissage de la zone : sans cela les vias GND restent non connectés.
    try:
        filler = pcbnew.ZONE_FILLER(board)
        filler.Fill(board.Zones())
    except Exception as exc:
        print(f"warning: remplissage zone GND impossible: {exc}", file=sys.stderr)
    return zone


def add_via(board, net, position):
    via = pcbnew.PCB_VIA(board)
    via.SetPosition(position)
    via.SetWidth(int(VIA_WIDTH_MM * 1_000_000))
    via.SetDrill(int(VIA_DRILL_MM * 1_000_000))
    via.SetLayerPair(board.GetLayerID("F.Cu"), board.GetLayerID("B.Cu"))
    via.SetNet(net)
    board.Add(via)
    return via


def main():
    parser = argparse.ArgumentParser(description="Routage assisté partiel (arbre + zone GND + vias)")
    parser.add_argument("--board", required=True)
    parser.add_argument("--nets", required=True)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    if pcbnew is None:
        fail(f"module pcbnew indisponible ({PCBNEW_IMPORT_ERROR})")

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

    # Idempotence : un nouveau routage repart d'un plateau sans pistes ni zones.
    removed = clear_routing(board)
    if removed["tracks"] or removed["vias"] or removed["zones"]:
        print(f"warning: ancien routage nettoyé: {removed}", file=sys.stderr)

    # Les pads doivent connaître leur net avant le routage, sinon KiCad
    # déclare des court-circuits (piste sur net, pad resté sur net 0).
    created_nets, assigned_pads, missing_pins = assign_nets(board, nets, pcbnew)
    if not args.dry_run:
        for net in nets:
            name = str(net.get("name") or "").strip()
            if name and board.FindNet(name) is None:
                fail(f"net introuvable après création: {name}")
    if missing_pins:
        print(f"warning: pins introuvables: {', '.join(missing_pins[:10])}", file=sys.stderr)

    board_bbox = board.GetBoardEdgesBoundingBox()
    pads_by_ref = capture_pads(board)
    layer_f = board.GetLayerID("F.Cu")
    routed = 0
    vias = 0
    zones = 0

    for net in nets:
        if not isinstance(net, dict):
            continue
        name = str(net.get("name") or "").strip()
        pins = net.get("pins") or []
        if not name or not isinstance(pins, list) or len(pins) < 2:
            continue

        if is_gnd(name):
            if not args.dry_run:
                gnd = board.FindNet(name)
                add_gnd_zone(board, gnd)
                zones += 1
                for pin in pins:
                    parsed = parse_pin(pin)
                    if not parsed:
                        continue
                    info = pads_by_ref.get(parsed[0], {}).get(parsed[1])
                    if info is None:
                        continue
                    pos = info["pos"]
                    # via à 0,8 mm du pad + piste de liaison : il n'est plus orphelin.
                    via_pos = pcbnew.VECTOR2I(pos.x + 800_000, pos.y)
                    routed += add_l_segment(
                        board, gnd, pos, via_pos, layer_f, pads_by_ref, board_bbox
                    )
                    add_via(board, gnd, via_pos)
                    vias += 1
            else:
                zones += 1
                vias += sum(1 for p in pins if parse_pin(p))
            continue

        net_item = board.FindNet(name)
        if net_item is None:
            continue
        endpoints = []
        for pin in pins:
            parsed = parse_pin(pin)
            if not parsed:
                continue
            info = pads_by_ref.get(parsed[0], {}).get(parsed[1])
            if info is not None:
                endpoints.append(info["pos"])
        if len(endpoints) < 2:
            print(f"warning: pins introuvables pour {name}", file=sys.stderr)
            continue
        root = endpoints[0]
        for target in endpoints[1:]:
            if not args.dry_run:
                routed += add_l_segment(
                    board, net_item, root, target, layer_f, pads_by_ref, board_bbox
                )
            else:
                routed += 2

    if args.dry_run:
        emit(
            {
                "ok": True,
                "wouldRoute": routed,
                "wouldZone": zones,
                "wouldVias": vias,
                "createdNets": created_nets,
                "assignedPads": assigned_pads,
                "missingPins": len(missing_pins),
            }
        )

    backup = board_path + ".bak"
    try:
        shutil.copy2(board_path, backup)
        tmp = board_path + ".tmp"
        pcbnew.SaveBoard(tmp, board)
        os.replace(tmp, board_path)
    except Exception as exc:
        fail(f"sauvegarde impossible: {exc}")

    emit({
        "ok": True,
        "routed": routed,
        "zones": zones,
        "vias": vias,
        "createdNets": created_nets,
        "assignedPads": assigned_pads,
        "missingPins": len(missing_pins),
    })


if __name__ == "__main__":
    main()
