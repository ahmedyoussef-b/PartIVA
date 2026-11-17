// Analyse États Réels — validation statique contre contraintes physiques
// V8-D-11-a-REFONTE — pas de score arbitraire, violations concrètes

export interface RealComponent {
  id: string;
  footprint?: string;
  currentDrawn?: number;
}

export interface RealPin {
  componentId: string;
  pinName: string;
}

export interface RealNet {
  name: string;
  pins?: RealPin[];
  vias?: unknown[];
}

export interface Violation {
  type: 'CURRENT_CAPACITY' | 'CLEARANCE' | 'VIA_DENSITY' | 'GROUND_PLANE';
  severity: 'CRITICAL' | 'WARNING';
  message: string;
  location?: string;
}

export interface RealStateAnalysis {
  violations: Violation[];
  isCompliant: boolean;
  checkedRules: number;
}

// Règles physiques réelles
const RULES = {
  MAX_CURRENT_0805: 0.5, // Ampères
  MIN_CLEARANCE_MM: 0.15,
  MAX_VIAS_PER_NET: 50,
};

export function analyzeRealState(components: RealComponent[], nets: RealNet[]): RealStateAnalysis {
  const violations: Violation[] = [];
  let checkedRules = 0;

  // 1. Capacité courant pad/footprint
  checkedRules++;
  components.forEach((comp) => {
    if (
      comp.footprint === '0805' &&
      comp.currentDrawn !== undefined &&
      comp.currentDrawn > RULES.MAX_CURRENT_0805
    ) {
      violations.push({
        type: 'CURRENT_CAPACITY',
        severity: 'CRITICAL',
        message: `Courant ${comp.currentDrawn}A dépasse capacité 0805 (${RULES.MAX_CURRENT_0805}A)`,
        location: comp.id,
      });
    }
  });

  // 2. Plan de masse (GND net doit exister et être connecté)
  checkedRules++;
  const gndNet = nets.find((n) => n.name.toLowerCase() === 'gnd');
  if (!gndNet || !gndNet.pins || gndNet.pins.length < 2) {
    violations.push({
      type: 'GROUND_PLANE',
      severity: 'CRITICAL',
      message: 'Réseau GND manquant ou non connecté (min 2 points requis)',
      location: 'GND',
    });
  }

  // 3. Densité vias par net
  checkedRules++;
  nets.forEach((net) => {
    const viaCount = net.vias?.length ?? 0;
    if (viaCount > RULES.MAX_VIAS_PER_NET) {
      violations.push({
        type: 'VIA_DENSITY',
        severity: 'WARNING',
        message: `Net ${net.name} a ${viaCount} vias (max ${RULES.MAX_VIAS_PER_NET})`,
        location: net.name,
      });
    }
  });

  return {
    violations,
    isCompliant: violations.filter((v) => v.severity === 'CRITICAL').length === 0,
    checkedRules,
  };
}
