// Garde-fou : refuse un chemin de projet KiCad situé dans un dossier temporaire.
// Pur et testable (aucune dépendance Next / fs).

const TEMP_PATTERNS: RegExp[] = [
  /%TEMP%/i,
  /%TMP%/i,
  /appdata[\\/]local[\\/]temp/i,
  /(^|[\\/])tmp[\\/]/i,
  /(^|[\\/])temp[\\/]/i,
];

export interface KicadPathValidation {
  ok: boolean;
  error?: string;
}

export function validateKicadFilePath(raw: string): KicadPathValidation {
  const value = raw.trim();
  if (!value) {
    return { ok: false, error: 'kicadFilePath requis' };
  }
  if (!value.toLowerCase().endsWith('.kicad_pcb')) {
    return { ok: false, error: 'kicadFilePath doit pointer vers un fichier .kicad_pcb' };
  }
  if (TEMP_PATTERNS.some((pattern) => pattern.test(value))) {
    return {
      ok: false,
      error: 'Le chemin du projet ne peut pas être dans un dossier temporaire.',
    };
  }
  return { ok: true };
}
