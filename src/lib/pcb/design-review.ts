// Revue de conception automatisée — bonnes pratiques électroniques
// V1 : règles simples (découplage, power-rail, footprints, références, DNP)

export interface DesignComponent {
  id: string;
  reference: string;
  name: string;
  footprint?: string;
  value?: string;
  dnp?: boolean;
  pins?: Array<{ name: string; type?: string }>;
}

export interface DesignNet {
  id: string;
  name: string;
  pins: Array<{ componentId: string; pinName: string }>;
}

export interface DesignFinding {
  severity: 'error' | 'warning' | 'info';
  category: 'decoupling' | 'power_rail' | 'footprint' | 'reference' | 'dnp';
  message: string;
  suggestion: string;
}

export interface DesignReviewResult {
  score: number; // 0-100
  findings: DesignFinding[];
  summary: { errors: number; warnings: number; infos: number };
}

export function runDesignReview(
  components: DesignComponent[],
  nets: DesignNet[],
): DesignReviewResult {
  const findings: DesignFinding[] = [];

  // 1. Footprints manquants
  for (const c of components) {
    if (!c.footprint) {
      findings.push({
        severity: 'error',
        category: 'footprint',
        message: `Composant ${c.reference} (${c.name}) sans footprint`,
        suggestion: 'Assigner un footprint dans la bibliothèque',
      });
    }
  }

  // 2. Références non annotées
  for (const c of components) {
    if (!c.reference || c.reference.includes('?')) {
      findings.push({
        severity: 'warning',
        category: 'reference',
        message: `Composant ${c.reference || '(sans ref)'} non annoté`,
        suggestion: 'Annoter les références (Tools > Annotate Schematic)',
      });
    }
  }

  // 3. Composants DNP
  for (const c of components) {
    if (c.dnp) {
      findings.push({
        severity: 'info',
        category: 'dnp',
        message: `Composant ${c.reference} marqué DNP (Do Not Populate)`,
        suggestion: 'Vérifier que le DNP est intentionnel',
      });
    }
  }

  // 4. Découplage (condensateurs près des ICs)
  const caps = components.filter((c) => c.name.toLowerCase().includes('condensateur'));
  const ics = components.filter(
    (c) => c.name.toLowerCase().includes('mcu') || c.name.toLowerCase().includes('stm32'),
  );
  for (const ic of ics) {
    const hasDecoupling = caps.length > 0;
    if (!hasDecoupling) {
      findings.push({
        severity: 'warning',
        category: 'decoupling',
        message: `IC ${ic.reference} sans condensateur de découplage`,
        suggestion: 'Ajouter un condensateur 100nF sur VCC de chaque IC',
      });
    }
  }

  // 5. Power-rail (VCC/GND présents)
  const hasPowerNet = nets.some((n) => /vcc|vdd|3v3|5v|gnd/i.test(n.name));
  if (!hasPowerNet) {
    findings.push({
      severity: 'error',
      category: 'power_rail',
      message: "Aucun net d'alimentation (VCC/GND) détecté",
      suggestion: 'Ajouter des nets VCC et GND explicites',
    });
  }

  const errors = findings.filter((f) => f.severity === 'error').length;
  const warnings = findings.filter((f) => f.severity === 'warning').length;
  const infos = findings.filter((f) => f.severity === 'info').length;

  // Score : 100 - (errors * 20) - (warnings * 5) - (infos * 1), min 0
  const score = Math.max(0, 100 - errors * 20 - warnings * 5 - infos * 1);

  return { score, findings, summary: { errors, warnings, infos } };
}
