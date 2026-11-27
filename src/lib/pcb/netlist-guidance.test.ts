import { describe, expect, it } from 'vitest';
import { validateNetlist } from './netlist-validation';
import {
  buildMissingPowerMessage,
  ensurePowerNets,
  HEURISTIC_POWER_WARNING,
  NET_EMPTY_MESSAGE,
  PIN_FORMAT_MESSAGE,
} from './netlist-guidance';

describe('netlist-guidance', () => {
  it('donne un format de pin explicite et un exemple', () => {
    expect(PIN_FORMAT_MESSAGE).toContain('REF.PIN');
    expect(PIN_FORMAT_MESSAGE).toContain('U1.7');
    expect(NET_EMPTY_MESSAGE).toContain('Générer les nets');
    expect(buildMissingPowerMessage(['U1'])).toContain("n'a pas de net d'alimentation");
  });

  it('ajoute VCC/GND uniquement avec des pads existants et marque le résultat à vérifier', () => {
    const result = ensurePowerNets(
      [{ reference: 'U1' }],
      [{ name: 'SIG', pins: ['U1.3', 'J1.1'], source: 'llm' }],
      new Map([['U1', ['1', '2', '3', '4', '5', '6', '7', '8']]]),
    );

    expect(result.fixedRefs).toEqual(['U1']);
    expect(result.warnings).toEqual([HEURISTIC_POWER_WARNING]);
    const vcc = result.nets.find((net) => net.name === 'VCC_5V');
    const gnd = result.nets.find((net) => net.name === 'GND');
    expect(vcc?.source).toBe('heuristic');
    expect(vcc?.status).toBe('to_verify');
    expect(gnd?.pins).toHaveLength(2);
    for (const pin of [...(vcc?.pins ?? []), ...(gnd?.pins ?? [])]) {
      const pad = pin.split('.')[1]!;
      expect(['1', '2', '3', '4', '5', '6', '7', '8']).toContain(pad);
    }
    expect(validateNetlist([{ reference: 'U1' }, { reference: 'J1' }], result.nets).ok).toBe(true);
  });

  it('ne touche pas aux nets déjà couverts', () => {
    const result = ensurePowerNets(
      [{ reference: 'U1' }],
      [
        { name: 'VCC_5V', pins: ['U1.1', 'C1.1'], source: 'llm' },
        { name: 'GND', pins: ['U1.2', 'C1.2'], source: 'llm' },
      ],
      new Map([['U1', ['1', '2', '3']]]),
    );
    expect(result.fixedRefs).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.nets).toHaveLength(2);
  });
});
