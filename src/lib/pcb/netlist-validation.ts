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

export const POWER_RE =
  /(^|[_+\s-])(vcc|vdd|vbat|3v3|5v|12v|24v|\+?(?:3|5|12|24)v\d*)(?:$|[_+\s-])/i;
export const GND_RE = /(^|[_+\s-])([a-z]?gnd|vss|ground|0v)(?:$|[_+\s-])/i;

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

// Ajout de raisons locales (F3) sans modifier la forme du rapport F2.
export type PinIssueReason =
  'UNKNOWN_REFERENCE' | 'PAD_NOT_FOUND' | 'PAD_NOT_READABLE' | 'BAD_FORMAT' | 'DUPLICATE_PIN';

export interface NetlistPinIssue {
  net: string;
  ref: string;
  pin: string;
  reason: PinIssueReason;
  /** Pads réellement disponibles sur l'empreinte (PAD_NOT_FOUND uniquement). */
  available?: string[];
  /** Empreinte KiCad lue pour ce composant, pour un message précis. */
  footprint?: string;
}

export interface NetlistDroppedNet {
  name: string;
  pins: string[];
  reason: 'NET_TOO_SHORT';
}

export interface NetlistReport {
  repaired: boolean;
  /** true si une édition manuelle a eu lieu après la génération. */
  stale: boolean;
  /** Code lisible côté UI (ex. INVALID_PINS), absent si tout est valide. */
  code?: string;
  invalidPins: NetlistPinIssue[];
  droppedPins: string[];
  droppedNets: NetlistDroppedNet[];
  unreadableFootprints: Array<{ ref: string; footprint: string }>;
  toVerify: string[];
}

export interface NetsAgainstFootprintsResult {
  nets: NetlistNet[];
  report: NetlistReport;
}

export interface ValidateNetsOptions {
  /** Empreinte lisible par référence, pour enrichir le rapport. */
  footprintsByRef?: Map<string, string>;
  /** Références résolues par fallback : à vérifier même si les pads sont lisibles. */
  fallbackRefs?: Set<string>;
}

/**
 * Filtre les nets LLM contre les pads réellement présents sur les empreintes.
 *
 * Règles :
 * - référence absente de `padsByRef` → UNKNOWN_REFERENCE, broche retirée ;
 * - empreinte connue mais pads illisibles (`[]`) → broche conservée et marquée
 *   `toVerify` (web sans KiCad, fichier absent) ;
 * - pad absent de l'empreinte → PAD_NOT_FOUND, broche retirée ;
 * - net réduit à moins de 2 broches → net retiré et signalé.
 */
export function validateNetsAgainstFootprints(
  nets: NetlistNet[],
  padsByRef: Map<string, string[]>,
  options: ValidateNetsOptions = {},
): NetsAgainstFootprintsResult {
  const invalidPins: NetlistPinIssue[] = [];
  const droppedPins: string[] = [];
  const droppedNets: NetlistDroppedNet[] = [];
  const unreadable = new Map<string, string>();
  const kept: NetlistNet[] = [];

  for (const net of nets) {
    const pins: string[] = [];
    for (const pin of net.pins) {
      const ref = compOfPin(pin);
      if (!padsByRef.has(ref)) {
        invalidPins.push({ net: net.name, ref, pin, reason: 'UNKNOWN_REFERENCE' });
        droppedPins.push(pin);
        continue;
      }
      const pads = padsByRef.get(ref) ?? [];
      if (pads.length === 0) {
        unreadable.set(ref, options.footprintsByRef?.get(ref) ?? '');
        pins.push(pin);
        continue;
      }
      const pad = pin.slice(ref.length + 1);
      if (!pads.includes(pad)) {
        invalidPins.push({
          net: net.name,
          ref,
          pin,
          reason: 'PAD_NOT_FOUND',
          available: [...pads],
        });
        droppedPins.push(pin);
        continue;
      }
      pins.push(pin);
    }
    if (pins.length >= 2) {
      kept.push({ name: net.name, pins });
    } else {
      droppedNets.push({ name: net.name, pins: [...net.pins], reason: 'NET_TOO_SHORT' });
    }
  }

  const toVerify = new Set<string>([...unreadable.keys(), ...(options.fallbackRefs ?? [])]);
  return {
    nets: kept,
    report: {
      repaired: invalidPins.length > 0 || droppedNets.length > 0,
      stale: false,
      invalidPins,
      droppedPins,
      droppedNets,
      unreadableFootprints: [...unreadable.entries()].map(([ref, footprint]) => ({
        ref,
        footprint,
      })),
      toVerify: [...toVerify],
    },
  };
}
