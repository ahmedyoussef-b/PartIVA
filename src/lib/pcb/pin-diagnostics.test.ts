import { describe, expect, it } from 'vitest';
import {
  diagnosePins,
  isBlockingPinIssue,
  mergePinIssues,
  pinIssueMessage,
  splitPinInput,
} from './pin-diagnostics';
import type { NetlistPinIssue } from './netlist-validation';

const pads = { U2: ['1', '2', '3'], C1: ['1', '2'] };
const refs = ['U2', 'C1'];
const footprints = { U2: 'Package_TO_SOT_THT:TO-220-3_Vertical' };

function diagnose(pins: string[]) {
  return diagnosePins({
    nets: [{ name: 'VCC', pins }],
    padsByRef: pads,
    refs,
    footprintsByRef: footprints,
  });
}

describe('splitPinInput', () => {
  it('découpe virgules, points-virgules et espaces', () => {
    expect(splitPinInput(' U1.7, U2.3; C1.1  ')).toEqual(['U1.7', 'U2.3', 'C1.1']);
  });
});

describe('diagnosePins', () => {
  it('signale un format invalide en nommant le pin', () => {
    const issues = diagnose(['U2-4', 'C1.1']);
    expect(issues[0]).toMatchObject({ reason: 'BAD_FORMAT', pin: 'U2-4' });
    expect(pinIssueMessage(issues[0]!)).toContain('U2-4 : format attendu REF.PIN');
  });

  it('signale une référence inconnue', () => {
    const issues = diagnose(['RLY1.1', 'C1.1']);
    expect(issues[0]).toMatchObject({ reason: 'UNKNOWN_REFERENCE', ref: 'RLY1' });
  });

  it('signale un pad absent avec les pads disponibles et l’empreinte', () => {
    const issues = diagnose(['U2.4', 'C1.1']);
    expect(issues[0]).toMatchObject({
      reason: 'PAD_NOT_FOUND',
      pin: 'U2.4',
      available: ['1', '2', '3'],
      footprint: 'Package_TO_SOT_THT:TO-220-3_Vertical',
    });
    const message = pinIssueMessage(issues[0]!);
    expect(message).toContain("la broche 4 n'existe pas");
    expect(message).toContain('TO-220-3_Vertical');
    expect(message).toContain('Pads disponibles : 1, 2, 3');
  });

  it('signale un pin dupliqué dans le même net', () => {
    const issues = diagnose(['U2.1', 'U2.1']);
    expect(issues[0]).toMatchObject({ reason: 'DUPLICATE_PIN', pin: 'U2.1' });
  });

  it('ne signale rien pour des pins valides', () => {
    expect(diagnose(['U2.1', 'C1.2'])).toEqual([]);
  });

  it('passe en mode dégradé si les pads sont illisibles', () => {
    const issues = diagnosePins({
      nets: [{ name: 'VCC', pins: ['U2.4', 'C1.1'] }],
      padsByRef: { U2: [], C1: [] },
      refs,
      footprintsByRef: footprints,
    });
    expect(issues).toHaveLength(2);
    expect(issues.every((i) => i.reason === 'PAD_NOT_READABLE')).toBe(true);
    expect(issues.every((i) => !isBlockingPinIssue(i))).toBe(true);
    expect(pinIssueMessage(issues[0]!)).toContain('à vérifier manuellement');
  });

  it('ne vérifie pas les références quand la liste est vide', () => {
    const issues = diagnosePins({
      nets: [{ name: 'VCC', pins: ['RLY1.1'] }],
      padsByRef: {},
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]?.reason).toBe('PAD_NOT_READABLE');
  });
});

describe('mergePinIssues', () => {
  it('déduplique par net et pin, en conservant le diagnostic serveur prioritaire', () => {
    const server: NetlistPinIssue[] = [
      { net: 'VCC', ref: 'U2', pin: 'U2.4', reason: 'PAD_NOT_FOUND', available: ['1', '2', '3'] },
    ];
    const local: NetlistPinIssue[] = [
      { net: 'VCC', ref: 'U2', pin: 'U2.4', reason: 'BAD_FORMAT' },
      { net: 'GND', ref: 'C1', pin: 'C1.9', reason: 'PAD_NOT_FOUND' },
    ];
    const merged = mergePinIssues(server, local);
    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({ reason: 'PAD_NOT_FOUND', available: ['1', '2', '3'] });
    expect(merged[1]).toMatchObject({ net: 'GND', pin: 'C1.9' });
  });
});
