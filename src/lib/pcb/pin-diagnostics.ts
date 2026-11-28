// Diagnostic « vivant » des pins saisis — pur, sans Next ni I/O.
// Le rapport F2 reste un diagnostic de génération ; celui-ci porte sur l'état
// actuellement édité et est recalculé à chaque rendu côté client.

import { pinIssueMessage } from './netlist-guidance';
import type { NetlistPinIssue } from './netlist-validation';

export { pinIssueMessage };

const PIN_FORMAT = /^[A-Za-z0-9_]+\.[^\s]+$/;

/** Découpe une saisie libre en tokens (virgules, points-virgules, espaces). */
export function splitPinInput(raw: string): string[] {
  return raw
    .split(/[,;\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export interface DiagnosePinsInput {
  nets: Array<{ name: string; pins: string[] }>;
  padsByRef: Record<string, string[]> | Map<string, string[]>;
  /** Références connues. Vide = mode dégradé, on ne vérifie pas la référence. */
  refs?: string[];
  footprintsByRef?: Record<string, string> | Map<string, string>;
}

export function diagnosePins({
  nets,
  padsByRef,
  refs,
  footprintsByRef,
}: DiagnosePinsInput): NetlistPinIssue[] {
  const pads = padsByRef instanceof Map ? padsByRef : new Map(Object.entries(padsByRef));
  const footprints =
    footprintsByRef instanceof Map
      ? footprintsByRef
      : new Map(Object.entries(footprintsByRef ?? {}));
  const knownRefs = refs && refs.length > 0 ? new Set(refs) : null;
  const issues: NetlistPinIssue[] = [];

  for (const net of nets) {
    const seen = new Set<string>();
    for (const raw of net.pins) {
      const pin = typeof raw === 'string' ? raw.trim() : '';
      const ref = pin.split('.')[0] ?? '';
      if (!PIN_FORMAT.test(pin)) {
        issues.push({ net: net.name, ref, pin, reason: 'BAD_FORMAT' });
        continue;
      }
      if (seen.has(pin)) {
        issues.push({ net: net.name, ref, pin, reason: 'DUPLICATE_PIN' });
        continue;
      }
      seen.add(pin);

      if (knownRefs && !knownRefs.has(ref)) {
        issues.push({ net: net.name, ref, pin, reason: 'UNKNOWN_REFERENCE' });
        continue;
      }
      const available = pads.get(ref);
      if (!available || available.length === 0) {
        // Pads illisibles (Vercel, KiCad absent) : simple avertissement.
        issues.push({
          net: net.name,
          ref,
          pin,
          reason: 'PAD_NOT_READABLE',
          footprint: footprints.get(ref),
        });
        continue;
      }
      const number = pin.slice(ref.length + 1);
      if (!available.includes(number)) {
        issues.push({
          net: net.name,
          ref,
          pin,
          reason: 'PAD_NOT_FOUND',
          available: [...available],
          footprint: footprints.get(ref),
        });
      }
    }
  }
  return issues;
}

/** Fusionne les diagnostics serveur et local, dédupliqués par net + pin. */
export function mergePinIssues(...lists: NetlistPinIssue[][]): NetlistPinIssue[] {
  const merged = new Map<string, NetlistPinIssue>();
  for (const list of lists) {
    for (const issue of list) {
      const key = `${issue.net}|${issue.pin}`;
      if (!merged.has(key)) merged.set(key, issue);
    }
  }
  return [...merged.values()];
}

/** Seul `PAD_NOT_READABLE` est non bloquant (mode dégradé F2). */
export function isBlockingPinIssue(issue: NetlistPinIssue): boolean {
  return issue.reason !== 'PAD_NOT_READABLE';
}
