import { describe, expect, it } from 'vitest';
import { validateNetlist } from './netlist-validation';

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
