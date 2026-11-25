// Résolution d'empreintes KiCad à partir d'une proposition LLM.
// Pur et testable : aucune dépendance Next, injection du système de fichiers.

import { existsSync, readFileSync, readdirSync } from 'node:fs';

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

export interface FootprintSize {
  widthMm: number;
  heightMm: number;
}

const sizeCache = new Map<string, FootprintSize | null>();
const padCache = new Map<string, string[]>();

/**
 * Bbox approximative du composant, déduite des pads du fichier .kicad_mod.
 * Volontairement « best-effort » : null si le fichier est absent ou illisible.
 * Le résultat est mis en cache par chemin (les composants répètent souvent
 * la même empreinte sur une carte).
 */
export function getFootprintSize(
  libName: string,
  footprintName: string,
  footprintsRoot = process.env.PARTIVA_KICAD_FOOTPRINTS_ROOT?.trim() ||
    'C:/Program Files/KiCad/10.0/share/kicad/footprints',
): FootprintSize | null {
  const lib = libName.trim().replace(/\.pretty$/i, '');
  const fp = footprintName.trim().replace(/\.kicad_mod$/i, '');
  if (!lib || !fp) return null;
  const filePath = `${footprintsRoot.replace(/\/$/, '')}/${lib}.pretty/${fp}.kicad_mod`;
  if (sizeCache.has(filePath)) return sizeCache.get(filePath) ?? null;

  let size: FootprintSize | null = null;
  try {
    const text = readFileSync(filePath, 'utf8');
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const block of text.split(/(?=\(pad\s)/).slice(1)) {
      const at = block.match(/\(at\s+(-?[\d.]+)\s+(-?[\d.]+)(?:\s+(-?[\d.]+))?\)/);
      const dims = block.match(/\(size\s+([\d.]+)\s+([\d.]+)\)/);
      if (!at || !dims) continue;
      const x = Number(at[1]);
      const y = Number(at[2]);
      let w = Number(dims[1]);
      let h = Number(dims[2]);
      const angle = Number(at[3] ?? 0);
      if (Math.abs(angle % 180) === 90) [w, h] = [h, w];
      minX = Math.min(minX, x - w / 2);
      maxX = Math.max(maxX, x + w / 2);
      minY = Math.min(minY, y - h / 2);
      maxY = Math.max(maxY, y + h / 2);
    }
    if (Number.isFinite(minX) && Number.isFinite(minY)) {
      size = {
        widthMm: Math.round((maxX - minX) * 100) / 100,
        heightMm: Math.round((maxY - minY) * 100) / 100,
      };
    }
  } catch {
    size = null;
  }
  sizeCache.set(filePath, size);
  return size;
}

/**
 * Numéros de pads réellement présents dans un .kicad_mod (source de vérité
 * pour valider les "REF.PIN" produits par le LLM). Best-effort : [] si le
 * fichier est absent ou illisible.
 */
export function getFootprintPadNumbers(
  libName: string,
  footprintName: string,
  footprintsRoot = process.env.PARTIVA_KICAD_FOOTPRINTS_ROOT?.trim() ||
    'C:/Program Files/KiCad/10.0/share/kicad/footprints',
): string[] {
  const lib = libName.trim().replace(/\.pretty$/i, '');
  const fp = footprintName.trim().replace(/\.kicad_mod$/i, '');
  if (!lib || !fp) return [];
  const filePath = `${footprintsRoot.replace(/\/$/, '')}/${lib}.pretty/${fp}.kicad_mod`;
  const cached = padCache.get(filePath);
  if (cached) return cached;

  let pads: string[] = [];
  try {
    const text = readFileSync(filePath, 'utf8');
    pads = [...text.matchAll(/\(pad\s+"([^"]+)"/g)].map((m) => m[1]!);
    if (pads.length === 0) {
      pads = [...text.matchAll(/\(pad\s+([A-Za-z0-9_-]+)\s/g)].map((m) => m[1]!);
    }
  } catch {
    pads = [];
  }
  padCache.set(filePath, pads);
  return pads;
}
