// Design Review Engine — règles métier extensibles avec hiérarchie de sévérité
// V8-D-12-a

export type Severity = 'BLOCKER' | 'MAJOR' | 'MINOR' | 'INFO';

export interface DesignComponent {
  id: string;
  refDes?: string;
  name?: string;
  type?: string;
  footprint?: string;
}

export interface DesignNet {
  name: string;
  pins?: Array<{ componentId: string; pinName: string }>;
}

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  location?: string;
  suggestion?: string;
}

export interface DesignRule {
  id: string;
  name: string;
  description: string;
  severity: Severity;
  check: (components: DesignComponent[], nets: DesignNet[]) => Finding[];
}

export interface DesignReviewReport {
  findings: Finding[];
  summary: {
    blocker: number;
    major: number;
    minor: number;
    info: number;
    total: number;
  };
  isPassable: boolean;
  checkedRules: number;
}

const DESIGN_RULES: DesignRule[] = [
  {
    id: 'DR-001',
    name: 'Découplage Alimentation',
    description: 'Chaque IC doit avoir un condensateur de découplage proche',
    severity: 'MAJOR',
    check: (components, nets) => {
      const findings: Finding[] = [];
      const ics = components.filter(
        (c) =>
          c.type === 'IC' ||
          c.footprint?.includes('SOIC') ||
          c.footprint?.includes('QFP') ||
          c.name?.toLowerCase().includes('mcu'),
      );

      ics.forEach((ic) => {
        const hasDecoupling = nets.some(
          (n) => n.name.toLowerCase().includes('vcc') || n.name.toLowerCase().includes('gnd'),
        );
        if (!hasDecoupling) {
          findings.push({
            ruleId: 'DR-001',
            severity: 'MAJOR',
            message: `IC ${ic.id} sans condensateur de découplage détecté`,
            location: ic.id,
            suggestion: 'Ajouter un condensateur 100nF entre VCC et GND à moins de 5mm',
          });
        }
      });
      return findings;
    },
  },
  {
    id: 'DR-002',
    name: 'Références Non Annotées',
    description: 'Tous les composants doivent avoir une référence unique',
    severity: 'BLOCKER',
    check: (components) => {
      const findings: Finding[] = [];
      const refs = components.map((c) => c.refDes || c.id);
      const duplicates = refs.filter((r, i) => refs.indexOf(r) !== i);

      [...new Set(duplicates)].forEach((ref) => {
        findings.push({
          ruleId: 'DR-002',
          severity: 'BLOCKER',
          message: `Référence dupliquée ou manquante : ${ref}`,
          location: ref,
          suggestion: 'Annoter tous les composants avec des références uniques (R1, C1, U1...)',
        });
      });
      return findings;
    },
  },
  {
    id: 'DR-003',
    name: 'Footprints Manquants',
    description: 'Chaque composant doit avoir un footprint assigné',
    severity: 'MAJOR',
    check: (components) => {
      const findings: Finding[] = [];
      components.forEach((c) => {
        if (!c.footprint || c.footprint.trim() === '') {
          findings.push({
            ruleId: 'DR-003',
            severity: 'MAJOR',
            message: `Composant ${c.id} sans footprint assigné`,
            location: c.id,
            suggestion: 'Assigner un footprint compatible depuis la bibliothèque',
          });
        }
      });
      return findings;
    },
  },
];

export function runDesignReview(
  components: DesignComponent[],
  nets: DesignNet[],
): DesignReviewReport {
  const allFindings: Finding[] = [];

  for (const rule of DESIGN_RULES) {
    try {
      const findings = rule.check(components, nets);
      allFindings.push(...findings);
    } catch (err) {
      allFindings.push({
        ruleId: rule.id,
        severity: 'INFO',
        message: `Erreur lors de l'exécution de la règle ${rule.name}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      });
    }
  }

  const summary = {
    blocker: allFindings.filter((f) => f.severity === 'BLOCKER').length,
    major: allFindings.filter((f) => f.severity === 'MAJOR').length,
    minor: allFindings.filter((f) => f.severity === 'MINOR').length,
    info: allFindings.filter((f) => f.severity === 'INFO').length,
    total: allFindings.length,
  };

  return {
    findings: allFindings.sort((a, b) => {
      const order: Record<Severity, number> = { BLOCKER: 0, MAJOR: 1, MINOR: 2, INFO: 3 };
      return order[a.severity] - order[b.severity];
    }),
    summary,
    isPassable: summary.blocker === 0,
    checkedRules: DESIGN_RULES.length,
  };
}
