import { describe, expect, it } from 'vitest';
import {
  checkConstraintViolations,
  extractNegativeConstraints,
  reconcileConflicts,
} from './negative-constraints';

describe('extractNegativeConstraints', () => {
  it('extrait plusieurs interdictions dans une phrase client', () => {
    expect(
      extractNegativeConstraints("Je ne veux pas de Wi-Fi, pas de batterie, pas d'écran tactile."),
    ).toEqual(['Wi-Fi', 'batterie', 'écran tactile']);
  });

  it('reconnaît les autres marqueurs de négation', () => {
    expect(
      extractNegativeConstraints(
        'Aucun relais. Sans écran. Éviter le 12V. Interdit d’ajouter une batterie.',
      ),
    ).toEqual(['relais', 'écran', '12V', 'ajouter une batterie']);
  });

  it('ignore les tournures idiomatiques', () => {
    expect(extractNegativeConstraints('Pas de problème, sans fil, pas seulement une LED.')).toEqual(
      [],
    );
  });

  it('déduplique les interdictions répétées', () => {
    expect(extractNegativeConstraints('Pas de WiFi. Pas de wifi.')).toEqual(['WiFi']);
  });

  it('ne renvoie rien si le texte est positif', () => {
    expect(extractNegativeConstraints('La carte embarque du WiFi et un relais.')).toEqual([]);
  });
});

describe('checkConstraintViolations', () => {
  const constraints = ['Wi-Fi'];

  it('signale une interdiction réintroduite dans compiled et dans une réponse', () => {
    const violations = checkConstraintViolations({
      compiled: 'La carte utilise le WiFi pour envoyer les données.',
      answers: [{ questionId: 'communications', answer: 'WiFi' }],
      constraints,
    });
    expect(violations).toHaveLength(2);
    expect(violations.some((v) => v.where === 'compiled')).toBe(true);
    expect(violations.some((v) => v.where === 'answer')).toBe(true);
    expect(violations[0]?.term).toBe('Wi-Fi');
  });

  it('ne signale pas la contrainte elle-même quand elle est formulée comme exclusion', () => {
    const violations = checkConstraintViolations({
      compiled: 'Wi-Fi exclu. La carte utilise BLE pour les notifications.',
      answers: [{ questionId: 'communications', answer: 'BLE' }],
      constraints,
    });
    expect(violations).toEqual([]);
  });

  it('ne vérifie pas une option sur un champ non concerné', () => {
    const violations = checkConstraintViolations({
      compiled: 'Alimentation 5 V.',
      answers: [{ questionId: 'outputs', answer: 'LED, WiFi' }],
      constraints,
    });
    expect(violations).toEqual([]);
  });

  it('vérifie les interdictions sans alias sur le texte compilé', () => {
    const violations = checkConstraintViolations({
      compiled: 'Boîtier étanche IP67.',
      answers: [],
      constraints: ['boîtier étanche'],
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]?.where).toBe('compiled');
  });
});

describe('reconcileConflicts', () => {
  it('ne garde que les conflits adossés à une interdiction extraite', () => {
    const conflicts = reconcileConflicts(
      [
        {
          questionId: 'communications',
          forbidden: 'WiFi',
          need: 'notifications smartphone',
          explanation: 'Le client demande des notifications mais exclut le WiFi.',
        },
        {
          questionId: 'outputs',
          forbidden: 'Bluetooth',
          need: 'LED',
          explanation: 'Aucune interdiction ne concerne Bluetooth.',
        },
      ],
      ['Wi-Fi'],
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      questionId: 'communications',
      forbidden: 'WiFi',
      need: 'notifications smartphone',
    });
  });

  it('déduplique les conflits identiques', () => {
    const item = {
      questionId: 'outputs',
      forbidden: 'relais',
      need: 'commander une charge',
      explanation: '',
    };
    expect(reconcileConflicts([item, { ...item }], ['relais'])).toHaveLength(1);
  });
});
