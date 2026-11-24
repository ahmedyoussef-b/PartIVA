#!/usr/bin/env python3
"""Place N empreintes sur un plateau .kicad_pcb en une seule transaction (API classique pcbnew).

Usage:
  python place_footprints.py --board <path.kicad_pcb> --input <items.json>
      [--dry-run] [--force] [--allow-outside]

JSON d'entrée (tableau) :
  [ { "libName": "Resistor_SMD", "footprintName": "R_0603_1608Metric",
      "reference": "R1", "value": "10k", "xMm": 10.0, "yMm": 10.0,
      "layer": "F.Cu", "rotation": 0 }, ... ]

Options :
  --dry-run        Valide sans écrire (aucun .bak, aucune réconciliation)
  --force          Ignore le verrou KiCad
  --allow-outside  Ignore le contrôle géométrique (hors plateau)

Sortie stdout : {"ok": true, "placed": N, "verified": N, "board": "<path>", "backup": "<path>"}
             ou {"ok": false, "error": "<message>"} + exit 1
"""

import argparse
import json
import os
import shutil
import subprocess
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
    """Détecte un verrou KiCad dans le dossier du plateau (nom contenant le basename, suffixe .lck)."""
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
    parser.add_argument("--force", action="store_true", help="Ignore le verrou KiCad")
    parser.add_argument("--allow-outside", action="store_true", help="Ignore le contrôle géométrique")
    parser.add_argument(
        "--verify",
        help="Relit le plateau dans un processus Python neuf et vérifie les positions attendues (JSON)",
    )
    args = parser.parse_args()

    try:
        import pcbnew
    except Exception as exc:
        fail(f"module pcbnew indisponible ({exc})")

    board_path = os.path.abspath(args.board)
    if not os.path.isfile(board_path):
        fail(f"plateau introuvable: {board_path}")

    # Mode vérification : relire le plateau dans un processus Python neuf.
    # KiCad 10.0.x dégrade les proxies SWIG après mutation d'un board : la
    # relecture doit donc se faire hors du processus qui a écrit le fichier.
    if args.verify:
        try:
            with open(os.path.abspath(args.verify), "r", encoding="utf-8") as fh:
                expected = json.load(fh)
            board = pcbnew.LoadBoard(board_path)
            actual = {}
            for fp in board.GetFootprints():
                position = fp.GetPosition()
                actual[fp.GetReference()] = (
                    position.x,
                    position.y,
                    normalize_rotation(fp.GetOrientationDegrees()),
                )
            problems = []
            for exp in expected:
                got = actual.get(exp["reference"])
                if not got:
                    problems.append(f"{exp['reference']} absent après relecture")
                    continue
                if (
                    abs(got[0] - exp["x_nm"]) > TOLERANCE_NM
                    or abs(got[1] - exp["y_nm"]) > TOLERANCE_NM
                ):
                    problems.append(f"{exp['reference']} position incorrecte")
                if rotation_delta(got[2], exp["rotation"]) > ROTATION_TOLERANCE_DEG:
                    problems.append(f"{exp['reference']} rotation incorrecte")
            if problems:
                fail("relecture : " + "; ".join(problems))
            emit({"ok": True, "verified": len(expected)})
        except SystemExit:
            raise
        except Exception as exc:
            fail(f"relecture impossible: {exc}")
        return

    # 1. Verrou KiCad
    if not args.force:
        lock = find_lock(board_path)
        if lock:
            fail(f"Plateau probablement ouvert dans KiCad (verrou: {lock}). Fermez-le ou utilisez --force.")

    # 2. Lecture du JSON
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

    # KiCad 10.0.x : `pcbnew.FootprintLoad()` utilise en interne un plugin SWIG
    # qui se dégrade en `SwigPyObject` après la première modification du plateau
    # (2e appel -> AttributeError: 'SwigPyObject' object has no attribute
    # 'FootprintLoad'). Garder notre propre instance PCB_IO_KICAD_SEXPR évite
    # ce bug et fonctionne aussi sur les versions antérieures.
    io = None
    try:
        io = pcbnew.PCB_IO_KICAD_SEXPR()
    except Exception:
        io = None

    try:
        board = pcbnew.LoadBoard(board_path)
    except Exception as exc:
        fail(f"chargement impossible: {exc}")

    # 3. Contrôle géométrique (bbox Edge.Cuts)
    if not args.allow_outside:
        try:
            bbox = board.GetBoardEdgesBoundingBox()
            width = bbox.GetWidth()
            height = bbox.GetHeight()
        except Exception as exc:
            bbox = None
            width = 0
            height = 0
            print(f"warning: bbox indisponible ({exc})", file=sys.stderr)

        if bbox is not None and width > 0 and height > 0:
            left, top = bbox.GetX(), bbox.GetY()
            right, bottom = bbox.GetRight(), bbox.GetBottom()
            for index, item in enumerate(items):
                if not isinstance(item, dict):
                    continue
                x_nm = int(float(item.get("xMm", 0) or 0) * 1_000_000)
                y_nm = int(float(item.get("yMm", 0) or 0) * 1_000_000)
                if not (left <= x_nm <= right and top <= y_nm <= bottom):
                    fail(
                        f"items[{index}] ({item.get('reference', '?')}) hors du plateau "
                        f"(x={item.get('xMm', 0)} mm, y={item.get('yMm', 0)} mm)"
                    )
        else:
            print("warning: bbox vide, contrôle géométrique ignoré", file=sys.stderr)

    # 4. Construction en mémoire. Une erreur = échec global, AUCUNE sauvegarde.
    # KiCad 10.0.x : les proxies SWIG retournés par le plateau perdent leurs
    # méthodes dès qu'on modifie ce plateau. On charge donc TOUTES les
    # empreintes et on capture les empreintes existantes AVANT toute mutation.
    prepared = []
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
            fp = (
                io.FootprintLoad(lib_path, fp_name)
                if io is not None
                else pcbnew.FootprintLoad(lib_path, fp_name)
            )
        except Exception as exc:
            fail(f"items[{index}] : FootprintLoad echoue: {exc}")
        if fp is None:
            fail(f"items[{index}] : empreinte introuvable: {lib_name}:{fp_name}")
        prepared.append((item, reference, fp))

    existing_by_ref = {}
    try:
        for existing in list(board.GetFootprints()):
            existing_by_ref[existing.GetReference()] = existing
    except Exception as exc:
        fail(f"lecture des empreintes du plateau impossible: {exc}")

    expected = []
    for index, (item, reference, fp) in enumerate(prepared):
        try:
            x_mm = float(item.get("xMm", 0) or 0)
            y_mm = float(item.get("yMm", 0) or 0)
            rotation = float(item.get("rotation") or 0)

            fp.SetReference(reference)
            fp.SetValue(item.get("value") or "")
            fp.SetPosition(pcbnew.VECTOR2I(int(x_mm * 1_000_000), int(y_mm * 1_000_000)))
            if rotation:
                fp.SetOrientationDegrees(rotation)
            layer_id = resolve_layer(board, item.get("layer"))
            if layer_id is not None:
                fp.SetLayer(layer_id)
        except Exception as exc:
            fail(f"items[{index}] : proprietes de l'empreinte: {exc}")

        # Idempotence : retirer l'ancienne empreinte de même référence
        # (déjà capturée avant toute mutation du plateau).
        old = existing_by_ref.pop(reference, None)
        if old is not None:
            try:
                board.Remove(old)
            except Exception as exc:
                fail(f"items[{index}] : retrait de l'ancienne empreinte: {exc}")

        try:
            board.Add(fp)
        except Exception as exc:
            fail(f"items[{index}] : ajout au plateau: {exc}")

        expected.append(
            {
                "reference": reference,
                "x_nm": int(x_mm * 1_000_000),
                "y_nm": int(y_mm * 1_000_000),
                "rotation": normalize_rotation(rotation),
            }
        )

    if args.dry_run:
        emit({"ok": True, "wouldPlace": True, "placed": len(items), "board": board_path})

    # 5. Sauvegarde de secours + écriture atomique
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

    # 6. Réconciliation post-écriture dans un PROCESSUS PYTHON NEUF.
    # Relire le plateau dans le processus qui vient de le muter échoue sur
    # KiCad 10.0.x (proxies SWIG dégradés) : on délègue donc à --verify.
    expected_path = board_path + ".expected.json"
    try:
        with open(expected_path, "w", encoding="utf-8") as fh:
            json.dump(expected, fh)
        proc = subprocess.run(
            [
                sys.executable,
                os.path.abspath(__file__),
                "--board",
                board_path,
                "--input",
                expected_path,
                "--verify",
                expected_path,
                "--force",
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
        lines = [line for line in proc.stdout.splitlines() if line.strip()]
        payload = json.loads(lines[-1]) if lines else {}
        if not payload.get("ok"):
            raise RuntimeError(payload.get("error") or proc.stderr.strip() or "relecture impossible")
    except Exception as exc:
        try:
            shutil.copy2(backup_path, board_path)
        except Exception:
            pass
        fail(f"relecture impossible: {exc} — plateau restaure depuis .bak")
    finally:
        try:
            os.remove(expected_path)
        except Exception:
            pass

    emit(
        {
            "ok": True,
            "placed": len(expected),
            "verified": len(expected),
            "board": board_path,
            "backup": backup_path,
        }
    )


if __name__ == "__main__":
    main()