import { describe, expect, it } from 'vitest';
import { validateNetlist, validateNetsAgainstFootprints } from './netlist-validation';

const components = [
  { reference: 'J1', name: '9V', footprint: 'Connector:TerminalBlock' },
  { reference: 'U1', name: 'NE555', footprint: 'Package_DIP:DIP-8' },
  { reference: 'C1', name: '10uF', footprint: 'Capacitor_THT:C_Disc' },
  { reference: 'Y1', name: '8MHz', footprint: 'Crystal:Crystal_HC49' },
];

describe('validateNetlist', () => {
  it('accepte une netlist cohérente', () => {
    const result = validateNetlist(components, [
      { name: 'VCC', pins: ['J1.1', 'U1.8'] },
      { name: 'GND', pins: ['J1.2', 'U1.1', 'C1.2'] },
    ]);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('bloque un composant actif sans GND', () => {
    const result = validateNetlist(components, [
      { name: 'VCC', pins: ['J1.1', 'U1.8'] },
      { name: 'SIG', pins: ['U1.3', 'C1.1'] },
    ]);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === 'NO_GND')).toBe(true);
    expect(result.errors.find((e) => e.code === 'NO_GND')?.message).toContain('U1');
  });

  it('détecte une broche inconnue', () => {
    const result = validateNetlist(components, [
      { name: 'GND', pins: ['J1.2', 'U9.1'] },
      { name: 'VCC', pins: ['J1.1', 'U1.8'] },
    ]);
    expect(result.errors.some((e) => e.code === 'UNKNOWN_PIN')).toBe(true);
  });

  it('détecte un net avec une seule broche', () => {
    const result = validateNetlist(components, [
      { name: 'GND', pins: ['J1.2', 'U1.1'] },
      { name: 'VCC', pins: ['J1.1'] },
    ]);
    expect(result.errors.some((e) => e.code === 'NET_TOO_SHORT')).toBe(true);
  });

  it('détecte une broche dupliquée sur deux nets', () => {
    const result = validateNetlist(components, [
      { name: 'GND', pins: ['J1.2', 'U1.1'] },
      { name: 'VCC', pins: ['J1.2', 'U1.8'] },
    ]);
    expect(result.errors.some((e) => e.code === 'DUPLICATE_PIN')).toBe(true);
  });

  it('vérifie qu’un net d’horloge connecte cristal et IC', () => {
    const result = validateNetlist(components, [
      { name: 'VCC', pins: ['J1.1', 'U1.8'] },
      { name: 'GND', pins: ['J1.2', 'U1.1'] },
      { name: 'OSC_IN', pins: ['U1.2', 'C1.1'] },
    ]);
    expect(result.errors.some((e) => e.code === 'CLOCK_NO_CRYSTAL')).toBe(true);
  });
});

describe('validateNetsAgainstFootprints', () => {
  const pads = new Map<string, string[]>([
    ['U2', ['1', '2', '3']],
    ['C1', ['1', '2']],
    ['U1', []],
  ]);
  const footprints = new Map<string, string>([
    ['U2', 'Package_TO_SOT_THT:TO-220-3_Vertical'],
    ['C1', 'Capacitor_SMD:C_0603_1608Metric'],
    ['U1', 'RF_Module:ESP32-WROOM-32'],
  ]);

  it('retire un pad inexistant sur une empreinte lisible, sans toVerify', () => {
    const result = validateNetsAgainstFootprints(
      [
        { name: 'VCC', pins: ['U2.4', 'C1.1'] },
        { name: 'GND', pins: ['U2.2', 'C1.2'] },
      ],
      pads,
      { footprintsByRef: footprints },
    );
    expect(result.nets).toEqual([{ name: 'GND', pins: ['U2.2', 'C1.2'] }]);
    expect(result.report.invalidPins).toEqual([
      {
        net: 'VCC',
        ref: 'U2',
        pin: 'U2.4',
        reason: 'PAD_NOT_FOUND',
        available: ['1', '2', '3'],
      },
    ]);
    expect(result.report.droppedPins).toEqual(['U2.4']);
    expect(result.report.droppedNets).toEqual([
      { name: 'VCC', pins: ['U2.4', 'C1.1'], reason: 'NET_TOO_SHORT' },
    ]);
    expect(result.report.toVerify).toEqual([]);
    expect(result.report.repaired).toBe(true);
  });

  it('retire une référence inventée', () => {
    const result = validateNetsAgainstFootprints(
      [
        { name: 'VCC', pins: ['RLY1.1', 'C1.1'] },
        { name: 'GND', pins: ['U2.2', 'C1.2'] },
      ],
      pads,
      { footprintsByRef: footprints },
    );
    expect(result.nets).toEqual([{ name: 'GND', pins: ['U2.2', 'C1.2'] }]);
    expect(result.report.invalidPins[0]).toMatchObject({
      ref: 'RLY1',
      pin: 'RLY1.1',
      reason: 'UNKNOWN_REFERENCE',
    });
  });

  it('conserve les pins d’une empreinte illisible et la marque toVerify', () => {
    const result = validateNetsAgainstFootprints(
      [
        { name: 'VCC', pins: ['U1.4', 'C1.1'] },
        { name: 'GND', pins: ['U1.1', 'C1.2'] },
      ],
      pads,
      { footprintsByRef: footprints },
    );
    expect(result.nets).toEqual([
      { name: 'VCC', pins: ['U1.4', 'C1.1'] },
      { name: 'GND', pins: ['U1.1', 'C1.2'] },
    ]);
    expect(result.report.invalidPins).toEqual([]);
    expect(result.report.droppedPins).toEqual([]);
    expect(result.report.toVerify).toEqual(['U1']);
    expect(result.report.unreadableFootprints).toEqual([
      { ref: 'U1', footprint: 'RF_Module:ESP32-WROOM-32' },
    ]);
  });

  it('ajoute les références résolues par fallback à toVerify', () => {
    const result = validateNetsAgainstFootprints([{ name: 'GND', pins: ['U2.2', 'C1.2'] }], pads, {
      footprintsByRef: footprints,
      fallbackRefs: new Set(['U2']),
    });
    expect(result.report.toVerify).toEqual(['U2']);
  });

  it('ne signale rien quand tout est valide', () => {
    const result = validateNetsAgainstFootprints([{ name: 'GND', pins: ['U2.2', 'C1.2'] }], pads, {
      footprintsByRef: footprints,
    });
    expect(result.nets).toEqual([{ name: 'GND', pins: ['U2.2', 'C1.2'] }]);
    expect(result.report.repaired).toBe(false);
    expect(result.report.invalidPins).toEqual([]);
  });
});
