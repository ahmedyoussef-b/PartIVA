#!/usr/bin/env python3
"""Import de schéma Eagle (.sch XML) — extraction composants et nets.

Usage :
  python import_schematic.py --file <path.sch>

Sortie stdout :
  {"ok": true, "format": "eagle-sch", "components": [{"reference","value","footprint"}],
   "nets": [{"name","pins":["U1.1",...]}], "warnings": [...]}
"""

import argparse
import json
import os
import re
import sys
import xml.etree.ElementTree as ET


def emit(payload, code=0):
    sys.stdout.write("\n" + json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()
    sys.exit(code)


def fail(message, code=1):
    emit({"ok": False, "error": message}, code)


def detect_format(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in (".sch", ".brd"):
        with open(path, "r", encoding="utf-8", errors="ignore") as fh:
            head = fh.read(512)
        if "<!DOCTYPE eagle" in head or "<eagle" in head:
            return "eagle-sch" if ext == ".sch" else "eagle-brd"
    if ext == ".net":
        return "netlist"
    return "unsupported"


def parse_eagle(path):
    warnings = []
    try:
        tree = ET.parse(path)
    except Exception as exc:
        fail(f"XML Eagle illisible: {exc}")
    root = tree.getroot()
    if root.tag != "eagle":
        fail("fichier Eagle invalide (racine != eagle)")

    components = []
    for part in root.findall(".//parts/part"):
        ref = part.get("name", "").strip()
        if not ref:
            continue
        value = part.get("value", "") or ""
        footprint = ""
        for attr in part.findall("attribute"):
            if attr.get("name") in ("FOOTPRINT", "footprint"):
                footprint = (attr.get("value") or attr.text or "").strip()
                break
        components.append({"reference": ref, "value": value, "footprint": footprint})
        if not footprint:
            warnings.append(f"{ref} : empreinte absente")

    nets = []
    for net in root.findall(".//nets/net"):
        name = (net.get("name") or "").strip()
        if not name:
            continue
        pins = []
        for child in net:
            if child.tag not in ("pin", "pad", "connect"):
                continue
            ref = child.get("ref") or child.get("component") or ""
            pin = child.get("pin") or child.get("number") or ""
            if ref and pin:
                pins.append(f"{ref}.{pin}")
            elif ref and "-" in ref:
                pins.append(ref.replace("-", ".", 1))
        if len(pins) >= 2:
            nets.append({"name": name, "pins": pins})
        else:
            warnings.append(f"net {name} : moins de 2 broches")

    known = {c["reference"] for c in components}
    for net in nets:
        for pin in net["pins"]:
            if pin.split(".")[0] not in known:
                warnings.append(f"net {net['name']} : broche {pin} sans composant")
                break
    return components, nets, warnings


def main():
    parser = argparse.ArgumentParser(description="Import schéma Eagle")
    parser.add_argument("--file", required=True)
    args = parser.parse_args()

    path = os.path.abspath(args.file)
    if not os.path.isfile(path):
        fail(f"fichier introuvable: {path}")
    fmt = detect_format(path)
    if fmt == "eagle-sch":
        components, nets, warnings = parse_eagle(path)
    elif fmt == "netlist":
        fail("netlist non supportée pour l'instant — utilisez un schéma Eagle .sch")
    else:
        fail(f"format non supporté: {fmt} (utilisez Eagle .sch)")

    emit({
        "ok": True,
        "format": fmt,
        "components": components,
        "nets": nets,
        "warnings": warnings[:100],
        "counts": {"components": len(components), "nets": len(nets), "warnings": len(warnings)},
    })


if __name__ == "__main__":
    main()
