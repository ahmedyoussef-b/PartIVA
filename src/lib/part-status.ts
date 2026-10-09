import { PartStatus, UserRole } from '@/generated/prisma/browser';

/**
 * Transitions autorisées entre états de pièce (D2).
 * Clé = état source, valeur = liste des états cibles autorisés.
 */
export const PART_STATUS_TRANSITIONS: Record<PartStatus, PartStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['IDENTIFYING', 'ON_HOLD', 'CANCELLED'],
  ON_HOLD: ['SUBMITTED', 'IDENTIFYING', 'CANCELLED'],
  IDENTIFYING: ['IDENTIFIED', 'SUBMITTED', 'ON_HOLD', 'CANCELLED'],
  IDENTIFIED: ['MEASURING', 'READY', 'CANCELLED'],
  MEASURING: ['READY', 'CANCELLED'],
  READY: ['ORDERED', 'CANCELLED'],
  ORDERED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['ARCHIVED'],
  ARCHIVED: [],
  CANCELLED: [],
};

/**
 * Rôles autorisés par transition (D3).
 * Clé = `${from}->${to}`, valeur = liste des rôles autorisés.
 * Note : USER est limité à ses propres pièces (vérifié côté API).
 */
export const PART_TRANSITION_ROLES: Record<string, UserRole[]> = {
  'DRAFT->SUBMITTED': ['USER', 'ADMIN'],
  'DRAFT->CANCELLED': ['USER', 'ADMIN'],
  'SUBMITTED->IDENTIFYING': ['ADMIN'],
  'SUBMITTED->ON_HOLD': ['ADMIN'],
  'SUBMITTED->CANCELLED': ['USER', 'ADMIN'],
  'ON_HOLD->SUBMITTED': ['ADMIN'],
  'ON_HOLD->IDENTIFYING': ['ADMIN'],
  'ON_HOLD->CANCELLED': ['USER', 'ADMIN'],
  'IDENTIFYING->IDENTIFIED': ['ADMIN'],
  'IDENTIFYING->SUBMITTED': ['ADMIN'],
  'IDENTIFYING->ON_HOLD': ['ADMIN'],
  'IDENTIFYING->CANCELLED': ['USER', 'ADMIN'],
  'IDENTIFIED->MEASURING': ['ADMIN'],
  'IDENTIFIED->READY': ['ADMIN'],
  'IDENTIFIED->CANCELLED': ['USER', 'ADMIN'],
  'MEASURING->READY': ['ADMIN'],
  'MEASURING->CANCELLED': ['USER', 'ADMIN'],
  'READY->ORDERED': ['USER', 'ADMIN'],
  'READY->CANCELLED': ['USER', 'ADMIN'],
  'ORDERED->DELIVERED': ['ADMIN'],
  'ORDERED->CANCELLED': ['USER', 'ADMIN'],
  'DELIVERED->ARCHIVED': ['ADMIN'],
};

/**
 * Vérifie qu'une transition est autorisée pour un rôle donné.
 * Ne vérifie PAS la propriété de la pièce (fait côté API).
 */
export function isTransitionAllowed(from: PartStatus, to: PartStatus, role: UserRole): boolean {
  const allowedTargets = PART_STATUS_TRANSITIONS[from] ?? [];
  if (!allowedTargets.includes(to)) return false;
  const roles = PART_TRANSITION_ROLES[`${from}->${to}`] ?? [];
  return roles.includes(role);
}
