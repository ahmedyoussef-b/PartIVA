// Messages pédagogiques et réparation heuristique de la netlist.
// La validation elle-même reste dans `netlist-validation.ts` : ce module ne
// fait que guider l'utilisateur et compléter les nets absents.

import { GND_RE, POWER_RE } from './netlist-validation';

export const LLM_NETLIST_EMPTY_CODE = 'LLM_NETLIST_EMPTY';

export const PIN_FORMAT_MESSAGE =
  'Format de pin invalide. Utilisez le format REF.PIN (ex : U1.7, U2.3). Assurez-vous que les numéros de broches existent bien sur le composant.';

export const NET_TOO_SHORT_MESSAGE =
  'Ajoutez au moins deux broches à ce net, au format REF.PIN (ex : U1.7, U2.3).';

export const NET_EMPTY_MESSAGE =
  'La génération automatique n’a pas réussi à créer les connexions. Vous pouvez : 1) Cliquer sur « Générer les nets (GND/VCC) » pour une création heuristique, 2) Éditer manuellement la netlist, ou 3) Vérifier que vos composants ont bien des empreintes valides.';

export const HEURISTIC_POWER_WARNING =
  'Avertissement : les nets VCC/GND ont été générés automatiquement par heuristique. Vérifiez les broches avant le routage.';

export function buildMissingPowerMessage(refs: string[]): string {
  return `Attention : votre microcontrôleur ${refs.join(', ')} n'a pas de net d'alimentation (VCC) ou de masse (GND). Le placement sera bloqué. Voulez-vous que nous ajoutions ces nets automatiquement ?`;
}

export interface GuidanceNet {
  name: string;
  pins: string[];
  source?: string;
  status?: string;
}

export interface PowerFixResult {
  nets: GuidanceNet[];
  warnings: string[];
  fixedRefs: string[];
}

/**
 * Complète VCC/GND pour les composants actifs (U*, IC*) qui n'ont pas de net
 * d'alimentation ou de masse, en n'utilisant que des pads réellement présents.
 * Les nets ajoutés sont marqués `heuristic` / `to_verify` : l'administrateur
 * doit les confirmer avant le routage.
 */
export function ensurePowerNets(
  components: Array<{ reference: string }>,
  nets: GuidanceNet[],
  padsByRef: Map<string, string[]>,
): PowerFixResult {
  const result = nets.map((net) => ({ ...net, pins: [...net.pins] }));
  const used = new Set(result.flatMap((net) => net.pins));
  const fixedRefs = new Set<string>();

  for (const comp of components) {
    const ref = comp.reference.trim();
    if (!/^(U|IC)\d*/i.test(ref)) continue;
    const pads = (padsByRef.get(ref) ?? []).map((pad) => `${ref}.${pad}`);
    if (pads.length === 0) continue;

    for (const [name, pattern] of [
      ['VCC_5V', POWER_RE],
      ['GND', GND_RE],
    ] as const) {
      const covered = result.some(
        (net) => pattern.test(net.name.trim()) && net.pins.some((pin) => pin.startsWith(`${ref}.`)),
      );
      if (covered) continue;

      const free = pads.filter((pad) => !used.has(pad));
      if (free.length === 0) continue;
      const pin = free[0]!;
      const existing = result.find((net) => net.name.trim().toLowerCase() === name.toLowerCase());
      if (existing) {
        existing.pins.push(pin);
        existing.source = 'heuristic';
        existing.status = 'to_verify';
        used.add(pin);
      } else {
        const second = free[1];
        if (!second) continue;
        result.push({
          name,
          pins: [pin, second],
          source: 'heuristic',
          status: 'to_verify',
        });
        used.add(pin);
        used.add(second);
      }
      fixedRefs.add(ref);
    }
  }

  return {
    nets: result,
    warnings: fixedRefs.size > 0 ? [HEURISTIC_POWER_WARNING] : [],
    fixedRefs: [...fixedRefs],
  };
}
