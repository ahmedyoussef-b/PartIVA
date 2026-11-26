// Profil de fabrication JLCPCB et validation DFM (Étape 8 roadmap).

export const JLCPCB_RULES = {
  minTrackWidthMm: 0.1,
  minClearanceMm: 0.1,
  minDrillMm: 0.3,
  minAnnularRingMm: 0.13,
  copperToEdgeMm: 0.5,
} as const;

export interface DfmViolation {
  type: string;
  severity: 'error' | 'warning';
  description: string;
  suggestion: string;
}

export interface DfmResult {
  ok: boolean;
  violations: DfmViolation[];
}

interface DrcLikeReport {
  ok?: boolean;
  violations?: number;
  details?: Array<{ type: string; severity: string; description: string }>;
  categories?: Record<string, number>;
}

/** Filtre les violations DRC qui dépassent les seuils JLCPCB. */
export function validateDfm(drc: DrcLikeReport | null | undefined): DfmResult {
  if (!drc) return { ok: true, violations: [] };
  const count = drc.violations ?? drc.details?.length ?? 0;
  if (count === 0) {
    return { ok: true, violations: [] };
  }

  const violations: DfmViolation[] = [];
  for (const detail of drc.details ?? []) {
    const type = detail.type;
    let severity: 'error' | 'warning' | null = null;
    let suggestion = 'Vérifier la règle de fabrication.';

    if (type === 'track_width') {
      severity = 'error';
      suggestion = `Largeur de piste inférieure à ${JLCPCB_RULES.minTrackWidthMm} mm.`;
    } else if (type === 'clearance' || type === 'shorting_items') {
      severity = 'error';
      suggestion = `Espacement inférieur à ${JLCPCB_RULES.minClearanceMm} mm.`;
    } else if (type === 'hole_clearance' || type === 'drill_to_drill') {
      severity = 'error';
      suggestion = `Perçage inférieur à ${JLCPCB_RULES.minDrillMm} mm.`;
    } else if (type === 'copper_edge_clearance' || type === 'edge_clearance') {
      severity = 'error';
      suggestion = `Dégagement cuivre-bord inférieur à ${JLCPCB_RULES.copperToEdgeMm} mm.`;
    } else if (type === 'solder_mask_bridge') {
      severity = 'warning';
      suggestion = 'Pont de masque de soudure : vérifier l’espacement des pads.';
    }

    if (severity) {
      violations.push({
        type,
        severity,
        description: detail.description || type,
        suggestion,
      });
    }
  }

  return { ok: violations.length === 0, violations: violations.slice(0, 50) };
}
