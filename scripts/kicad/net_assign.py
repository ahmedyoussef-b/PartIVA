"""Utilitaire partagé : assigner les nets aux pads à partir de la netlist BDD.

Les pistes créées avec SetNet() ne suffisent pas : si les pads restent sur le
net 0, KiCad déclare des court-circuits. Cette fonction est utilisée à la fois
par route_board.py (routage assisté) et specctra.py (avant export DSN).
"""

import re


def parse_pin(pin):
    """'U1.3' -> ('U1', '3')."""
    text = str(pin).strip()
    if "." not in text:
        return None
    ref, number = text.rsplit(".", 1)
    return (ref, number) if ref and number else None


def assign_nets(board, nets, pcbnew):
    """Crée les NETINFO_ITEM manquants et assigne chaque pad de netlist.

    Retourne (created_names, assigned_count, missing_pins).
    """
    # Anti-SWIG : capturer les empreintes et leurs pads avant mutation.
    pads_by_ref = {}
    for fp in board.GetFootprints():
        ref = fp.GetReference()
        pads_by_ref[ref] = {pad.GetNumber(): pad for pad in fp.Pads()}

    created = []
    assigned = 0
    missing = []
    for net in nets:
        if not isinstance(net, dict):
            continue
        name = str(net.get("name") or "").strip()
        pins = net.get("pins") or []
        if not name or not isinstance(pins, list):
            continue
        info = board.FindNet(name)
        if info is None:
            info = pcbnew.NETINFO_ITEM(board, name)
            board.Add(info)
            created.append(name)
        for pin in pins:
            parsed = parse_pin(pin)
            if not parsed:
                continue
            ref, number = parsed
            pad = pads_by_ref.get(ref, {}).get(number)
            if pad is None:
                missing.append(str(pin))
                continue
            if pad.GetNetname() != name:
                pad.SetNet(info)
            assigned += 1
    return created, assigned, missing
