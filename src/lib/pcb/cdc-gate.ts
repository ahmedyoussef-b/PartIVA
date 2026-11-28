// Gating séquentiel du PCB — pur, sans I/O.
// Une seule source de vérité : `project.status === 'requirements_validated'`.
// La présence de lignes d'exigences (même proposées) ne vaut pas validation.

export const CDC_CATEGORIES = [
  'usage',
  'function',
  'processing',
  'mechanical',
  'manufacturing',
  'quality',
] as const;

export interface CdcRequirementView {
  category?: string | null;
  key?: string | null;
  value?: string | null;
  status?: string | null;
}

export interface CdcCompleteness {
  ready: boolean;
  missing: string[];
}

/** Toutes les catégories techniques doivent être renseignées et confirmées. */
export function evaluateCdcCompleteness(requirements: CdcRequirementView[]): CdcCompleteness {
  const missing: string[] = [];
  for (const category of CDC_CATEGORIES) {
    const rows = requirements.filter((r) => (r.category ?? '').trim() === category);
    if (rows.length === 0 || rows.some((r) => !String(r.value ?? '').trim())) {
      missing.push(category);
    }
  }
  const unconfirmed = requirements.filter((r) => r.status !== 'confirmed').length;
  if (unconfirmed > 0) missing.push(`${unconfirmed} champ(s) à confirmer`);
  return { ready: missing.length === 0, missing };
}

export interface CdcGateInput {
  status?: string | null;
  requirements?: CdcRequirementView[];
}

export interface CdcGateResult extends CdcCompleteness {
  ready: boolean;
  reason: string;
}

/**
 * Décide si le projet peut passer au layout.
 *
 * - projets historiques créés via le formulaire 7 blocs : statut validé et
 *   aucune exigence analysée → autorisés (le formulaire est la source) ;
 * - projets analysés : statut validé **et** exigences complètes/confirmées.
 */
export function evaluateCdcGate({ status, requirements = [] }: CdcGateInput): CdcGateResult {
  if (status !== 'requirements_validated') {
    return {
      ready: false,
      missing: ['validation'],
      reason: 'Complétez et validez le cahier des charges avant de passer au layout.',
    };
  }
  if (requirements.length === 0) {
    return { ready: true, missing: [], reason: '' };
  }
  const completeness = evaluateCdcCompleteness(requirements);
  if (!completeness.ready) {
    return {
      ready: false,
      missing: completeness.missing,
      reason: `Cahier des charges incomplet : ${completeness.missing.join(', ')}.`,
    };
  }
  return { ready: true, missing: [], reason: '' };
}

export const CDC_NOT_VALIDATED_ERROR = 'CDC_NOT_VALIDATED';
export const CDC_NOT_VALIDATED_MESSAGE =
  'Complétez et validez le cahier des charges avant de générer le PCB.';
