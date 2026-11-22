// Résolution d'empreintes KiCad à partir d'une proposition LLM.
// Pur et testable : aucune dépendance Next, injection du système de fichiers.

import { existsSync, readdirSync } from 'node:fs';

export interface FootprintRef {
  libName: string;
  footprintName: string;
}

export interface ResolvedFootprint extends FootprintRef {
  /** true si l'empreinte proposée n'existe pas et qu'un fallback a été appliqué. */
  corrected: boolean;
  /** Empreinte proposée avant correction (pour traçabilité). */
  proposed: string;
}

/** Empreintes de repli, vérifiées présentes dans KiCad 10. */
const FALLBACKS: Record<string, FootprintRef> = {
  U: { libName: 'Package_TO_SOT_THT', footprintName: 'TO-220-3_Vertical' },
  R: { libName: 'Resistor_SMD', footprintName: 'R_0603_1608Metric' },
  C: { libName: 'Capacitor_SMD', footprintName: 'C_0603_1608Metric' },
  L: { libName: 'Inductor_SMD', footprintName: 'L_0805_2012Metric' },
  D: { libName: 'Diode_SMD', footprintName: 'D_SOD-123' },
  LED: { libName: 'LED_SMD', footprintName: 'LED_0603_1608Metric' },
  Q: { libName: 'Package_TO_SOT_SMD', footprintName: 'SOT-23' },
  J: { libName: 'Connector_PinHeader_2.54mm', footprintName: 'PinHeader_1x02_P2.54mm_Vertical' },
  P: { libName: 'Connector_PinHeader_2.54mm', footprintName: 'PinHeader_1x02_P2.54mm_Vertical' },
  X: { libName: 'Crystal', footprintName: 'Crystal_SMD_3225-4Pin_3.2x2.5mm' },
  Y: { libName: 'Crystal', footprintName: 'Crystal_SMD_3225-4Pin_3.2x2.5mm' },
  F: { libName: 'Fuse', footprintName: 'Fuse_1206_3216Metric' },
};

const DEFAULT_FALLBACK: FootprintRef = FALLBACKS.R as FootprintRef;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function refPrefix(reference: string): string {
  const prefix = reference.replace(/[0-9].*$/, '').toUpperCase();
  return prefix || 'R';
}

export interface FsAdapter {
  exists: (p: string) => boolean;
  list: (dir: string) => string[];
}

const NODE_FS: FsAdapter = {
  exists: (p) => existsSync(p),
  list: (dir) => {
    try {
      return readdirSync(dir);
    } catch {
      return [];
    }
  },
};

/**
 * Résout une empreinte proposée vers une empreinte réellement installée.
 * Ordre : exact → autre bibliothèque → fuzzy normalisé → fallback par référence.
 */
export function resolveKicadFootprint(
  libName: string,
  footprintName: string,
  reference: string,
  footprintsRoot: string,
  fs: FsAdapter = NODE_FS,
): ResolvedFootprint {
  const lib = libName.trim().replace(/\.pretty$/i, '');
  const fp = footprintName.trim().replace(/\.kicad_mod$/i, '');
  const proposed = `${lib}:${fp}`;

  if (!lib || !fp) {
    const fb = FALLBACKS[refPrefix(reference)] ?? DEFAULT_FALLBACK;
    return { ...fb, corrected: true, proposed };
  }

  if (fs.exists(`${footprintsRoot}/${lib}.pretty/${fp}.kicad_mod`)) {
    return { libName: lib, footprintName: fp, corrected: false, proposed };
  }

  let dirs: string[] = [];
  try {
    dirs = fs.list(footprintsRoot).filter((d) => d.endsWith('.pretty'));
  } catch {
    dirs = [];
  }

  for (const dir of dirs) {
    if (fs.exists(`${footprintsRoot}/${dir}/${fp}.kicad_mod`)) {
      return {
        libName: dir.replace(/\.pretty$/i, ''),
        footprintName: fp,
        corrected: false,
        proposed,
      };
    }
  }

  const needle = normalize(fp);
  if (needle.length >= 4) {
    for (const dir of dirs) {
      for (const file of fs.list(`${footprintsRoot}/${dir}`)) {
        if (!file.endsWith('.kicad_mod')) continue;
        const name = file.replace(/\.kicad_mod$/i, '');
        const candidate = normalize(name);
        if (candidate.includes(needle) || needle.includes(candidate)) {
          return {
            libName: dir.replace(/\.pretty$/i, ''),
            footprintName: name,
            corrected: false,
            proposed,
          };
        }
      }
    }
  }

  const fb = FALLBACKS[refPrefix(reference)] ?? DEFAULT_FALLBACK;
  return { ...fb, corrected: true, proposed };
}
