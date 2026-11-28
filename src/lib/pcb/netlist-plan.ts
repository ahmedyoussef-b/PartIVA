// Plan de sauvegarde atomique de la netlist — pur, sans Prisma ni Next.
// La modale envoie un état complet ; le serveur calcule le diff par `id` et
// l'applique en une seule transaction (suppressions → mises à jour → ajouts).

import { NET_TOO_SHORT_MESSAGE } from './netlist-guidance';
import type { PinIssueReason } from './netlist-validation';

export interface NetInput {
  id?: string;
  name: string;
  pins: string[];
  source?: string | null;
}

export interface CurrentNet extends NetInput {
  id: string;
}

export type NetIssueCode =
  'EMPTY_NAME' | 'DUPLICATE_NAME' | 'DUPLICATE_ID' | 'TOO_FEW_PINS' | 'PIN_ISSUE';

export interface NetIssue {
  code: NetIssueCode;
  /** Index de la ligne fautive dans le payload reçu. */
  index: number;
  name: string;
  message: string;
  /** Champs propres à PIN_ISSUE (F3). */
  net?: string;
  pin?: string;
  reason?: PinIssueReason;
  available?: string[];
  footprint?: string;
}

export interface NetPlan {
  /** Ids présents en BDD mais absents du payload. */
  deleteIds: string[];
  /** Renommages et/ou changements de pins, par id stable. */
  updates: Array<{ id: string; name: string; pins: string[] }>;
  /** Lignes sans id : créations. */
  creates: Array<{ name: string; pins: string[] }>;
  /** Erreurs de validation des données → 422, aucune écriture. */
  issues: NetIssue[];
  /** Ids envoyés par le client mais introuvables en BDD → 409 (dérive). */
  unknownIds: string[];
}

/** Même regex que la route historique : on ne la modifie pas, on la centralise. */
export function normalizeNetPins(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is string => typeof p === 'string')
    .map((p) => p.trim())
    .filter((p) => /^[A-Za-z0-9_]+\.[^\s]+$/.test(p));
}

/**
 * Construit le plan unique à partir de l'état courant et de l'état voulu.
 *
 * L'unicité des noms est contrôlée de façon insensible à la casse (la BDD
 * n'a pas de contrainte). Les suppressions sont calculées avant les ajouts :
 * un net supprimé puis recréé avec le même nom ne déclenche donc pas de conflit.
 */
export function buildNetPlan(current: CurrentNet[], desired: NetInput[]): NetPlan {
  const plan: NetPlan = { deleteIds: [], updates: [], creates: [], issues: [], unknownIds: [] };
  const byId = new Map(current.map((n) => [n.id, n]));
  const names = new Set<string>();
  const keptIds = new Set<string>();

  desired.forEach((row, index) => {
    const name = typeof row?.name === 'string' ? row.name.trim() : '';
    const pins = normalizeNetPins(row?.pins);
    const id = typeof row?.id === 'string' ? row.id.trim() : '';

    if (!name) {
      plan.issues.push({
        code: 'EMPTY_NAME',
        index,
        name,
        message: 'Tous les nets doivent avoir un nom',
      });
    } else {
      const key = name.toLowerCase();
      if (names.has(key)) {
        plan.issues.push({
          code: 'DUPLICATE_NAME',
          index,
          name,
          message: `Net en double : ${name}`,
        });
      }
      names.add(key);
    }

    if (pins.length < 2) {
      plan.issues.push({ code: 'TOO_FEW_PINS', index, name, message: NET_TOO_SHORT_MESSAGE });
    }

    if (!id) {
      plan.creates.push({ name, pins });
      return;
    }

    const before = byId.get(id);
    if (!before) {
      plan.unknownIds.push(id);
      return;
    }
    if (keptIds.has(id)) {
      plan.issues.push({
        code: 'DUPLICATE_ID',
        index,
        name,
        message: `Net en double (identifiant ${id})`,
      });
      return;
    }
    keptIds.add(id);

    const pinsChanged =
      JSON.stringify([...(before.pins ?? [])].sort()) !== JSON.stringify([...pins].sort());
    if (before.name !== name || pinsChanged) {
      plan.updates.push({ id, name, pins });
    }
  });

  plan.deleteIds = current.filter((n) => !keptIds.has(n.id)).map((n) => n.id);
  return plan;
}
