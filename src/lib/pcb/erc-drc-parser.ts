// Parser ERC/DRC — transforme les rapports JSON de kicad-cli en structure normalisée

export interface Violation {
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: string;
  type?: string;
}

export interface ParsedReport {
  violations: Violation[];
  counts: { error: number; warning: number; info: number };
  success: boolean;
}

interface KicadErcDrcJson {
  violations?: Array<{
    severity: string;
    message?: string;
    description?: string;
    location?: string;
    type?: string;
  }>;
  [key: string]: unknown;
}

function normalizeSeverity(s: string): 'error' | 'warning' | 'info' {
  const lower = s.toLowerCase();
  if (lower === 'error' || lower === 'fatal') return 'error';
  if (lower === 'warning' || lower === 'warn') return 'warning';
  return 'info';
}

export function parseErcReport(json: string): ParsedReport {
  return parseReport(json, 'ERC');
}

export function parseDrcReport(json: string): ParsedReport {
  return parseReport(json, 'DRC');
}

function parseReport(json: string, type: string): ParsedReport {
  try {
    const data = JSON.parse(json) as KicadErcDrcJson;
    const rawViolations = data.violations ?? [];
    const violations: Violation[] = rawViolations.map((v) => ({
      severity: normalizeSeverity(v.severity ?? 'info'),
      message: v.message ?? v.description ?? 'Violation sans description',
      location: v.location,
      type: v.type ?? type,
    }));

    const counts = {
      error: violations.filter((v) => v.severity === 'error').length,
      warning: violations.filter((v) => v.severity === 'warning').length,
      info: violations.filter((v) => v.severity === 'info').length,
    };

    return { violations, counts, success: counts.error === 0 };
  } catch {
    return {
      violations: [],
      counts: { error: 0, warning: 0, info: 0 },
      success: false,
    };
  }
}
