// Validation interne de la netlist — vérifie la cohérence électrique sans schéma KiCad.
// Le LLM ne fournit que la topologie : on bloque le placement si elle est incohérente.

export interface NetlistIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

export interface NetlistValidationResult {
  ok: boolean;
  errors: NetlistIssue[];
  warnings: NetlistIssue[];
}

export interface NetlistComponent {
  reference: string;
  name?: string | null;
  footprint?: string | null;
}

export interface NetlistNet {
  name: string;
  pins: string[];
}

const POWER_RE = /(^|[_+\s-])(vcc|vdd|vbat|3v3|5v|12v|24v|\+?(?:3|5|12|24)v\d*)(?:$|[_+\s-])/i;
const GND_RE = /(^|[_+\s-])([a-z]?gnd|vss|ground|0v)(?:$|[_+\s-])/i;

function isPower(name: string): boolean {
  return POWER_RE.test(name.trim());
}

function isGnd(name: string): boolean {
  return GND_RE.test(name.trim());
}

function compOfPin(pin: string): string {
  return pin.split('.')[0] ?? pin;
}

export function validateNetlist(
  components: NetlistComponent[],
  nets: NetlistNet[],
): NetlistValidationResult {
  const errors: NetlistIssue[] = [];
  const warnings: NetlistIssue[] = [];
  const refs = new Set(components.map((c) => c.reference.trim()));

  if (nets.length === 0) {
    errors.push({ severity: 'error', code: 'NO_NETS', message: 'Aucun réseau défini.' });
    return { ok: false, errors, warnings };
  }

  const pinOwners = new Map<string, string>();
  for (const net of nets) {
    if (net.pins.length < 2) {
      errors.push({
        severity: 'error',
        code: 'NET_TOO_SHORT',
        message: `Le net ${net.name} contient moins de 2 broches.`,
      });
    }
    for (const pin of net.pins) {
      const owner = compOfPin(pin);
      if (!refs.has(owner)) {
        errors.push({
          severity: 'error',
          code: 'UNKNOWN_PIN',
          message: `La broche ${pin} du net ${net.name} ne correspond à aucun composant.`,
        });
        continue;
      }
      const previous = pinOwners.get(pin);
      if (previous && previous !== net.name) {
        errors.push({
          severity: 'error',
          code: 'DUPLICATE_PIN',
          message: `La broche ${pin} est connectée aux nets ${previous} et ${net.name}.`,
        });
      } else {
        pinOwners.set(pin, net.name);
      }
    }
  }

  // Alimentation des composants actifs (U*, IC*).
  for (const comp of components) {
    if (!/^(U|IC)\d*/i.test(comp.reference.trim())) continue;
    const connected = [...pinOwners.entries()]
      .filter(([pin]) => compOfPin(pin) === comp.reference)
      .map(([, name]) => name);
    if (!connected.some(isPower)) {
      errors.push({
        severity: 'error',
        code: 'NO_POWER',
        message: `Le composant ${comp.reference} n'a pas de connexion d'alimentation. Corrigez via « Éditer la Netlist ».`,
      });
    }
    if (!connected.some(isGnd)) {
      errors.push({
        severity: 'error',
        code: 'NO_GND',
        message: `Le composant ${comp.reference} n'a pas de connexion GND. Corrigez via « Éditer la Netlist ».`,
      });
    }
  }

  // Signaux critiques.
  const hasClock = nets.some((n) => /osc_in|osc_out|xtal/i.test(n.name));
  if (hasClock) {
    const clockNet = nets.find((n) => /osc_in|osc_out|xtal/i.test(n.name))!;
    const refsInNet = new Set(clockNet.pins.map(compOfPin));
    if (![...refsInNet].some((r) => /^Y/i.test(r))) {
      errors.push({
        severity: 'error',
        code: 'CLOCK_NO_CRYSTAL',
        message: `Le net ${clockNet.name} ne connecte pas de cristal (Y*). Vérifiez la netlist.`,
      });
    }
    if (![...refsInNet].some((r) => /^(U|IC)/i.test(r))) {
      errors.push({
        severity: 'error',
        code: 'CLOCK_NO_IC',
        message: `Le net ${clockNet.name} ne connecte pas de microcontrôleur (U*). Vérifiez la netlist.`,
      });
    }
  }

  const hasRs485 = nets.some((n) => /rs485_[ab]/i.test(n.name));
  if (hasRs485) {
    const rsNet = nets.find((n) => /rs485_[ab]/i.test(n.name))!;
    const refsInNet = new Set(rsNet.pins.map(compOfPin));
    if (![...refsInNet].some((r) => /^(U|IC)/i.test(r))) {
      warnings.push({
        severity: 'warning',
        code: 'RS485_NO_TRANSCEIVER',
        message: `Le net ${rsNet.name} ne connecte pas de transceiver (U*).`,
      });
    }
    if (![...refsInNet].some((r) => /^J/i.test(r))) {
      warnings.push({
        severity: 'warning',
        code: 'RS485_NO_CONNECTOR',
        message: `Le net ${rsNet.name} ne connecte pas de connecteur (J*).`,
      });
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
