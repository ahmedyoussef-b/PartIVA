/**
 * Constantes partagées recherche (E12-R1d).
 *
 * Source unique des valeurs de statut — alignée sur l'enum Prisma `PartStatus`
 * (clôture de la dette D-E12-STATUS-ENUM, alignement prévu « effort Faible »).
 */
export const PART_STATUS_VALUES = [
  'DRAFT',
  'SUBMITTED',
  'ON_HOLD',
  'IDENTIFYING',
  'IDENTIFIED',
  'MEASURING',
  'READY',
  'ORDERED',
  'DELIVERED',
  'ARCHIVED',
  'CANCELLED',
] as const;

export type PartStatusValue = (typeof PART_STATUS_VALUES)[number];
