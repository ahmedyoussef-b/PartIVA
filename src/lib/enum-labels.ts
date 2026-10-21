import type {
  AttachmentKind,
  MachineStatus,
  MachineType,
  MaterialCategory,
  PartStatus,
} from '@/generated/prisma/browser';

export const MACHINE_TYPE_LABELS: Record<MachineType, string> = {
  CNC: 'Commande numérique (CNC)',
  LATHE: 'Tour',
  PRINTER_3D: 'Imprimante 3D',
};

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  THERMOSTABLE_TECHNIQUE: 'Thermostable technique',
  THERMOPLASTIQUE_RENFORCE: 'Thermoplastique renforcé',
  POLYMERE_TECHNIQUE_POINT: 'Polymère technique de pointe',
  FLUOROPOLYMERE_HAUTE_TEMP: 'Fluoropolymère haute température',
  POLYOLEFINE_POLYVALENTE: 'Polyoléfine polyvalente',
};

export function getMachineTypeLabel(type: MachineType): string {
  return MACHINE_TYPE_LABELS[type] ?? type;
}

export const MACHINE_STATUS_LABELS: Record<MachineStatus, string> = {
  IDLE: 'Libre',
  RUNNING: 'En marche',
  MAINTENANCE: 'Maintenance',
  OFFLINE: 'Hors ligne',
};

export function getMachineStatusLabel(status: MachineStatus): string {
  return MACHINE_STATUS_LABELS[status] ?? status;
}

export function getMaterialCategoryLabel(category: MaterialCategory): string {
  return MATERIAL_CATEGORY_LABELS[category] ?? category;
}

export const PART_STATUS_LABELS: Record<PartStatus, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumise',
  ON_HOLD: 'En attente',
  IDENTIFYING: 'Identification en cours',
  IDENTIFIED: 'Identifiée',
  MEASURING: 'Mesures en cours',
  READY: 'Prête',
  ORDERED: 'Commandée',
  DELIVERED: 'Livrée',
  ARCHIVED: 'Archivée',
  CANCELLED: 'Annulée',
};

export function getPartStatusLabel(status: PartStatus): string {
  return PART_STATUS_LABELS[status] ?? status;
}

export const ATTACHMENT_KIND_LABELS: Record<AttachmentKind, string> = {
  DOCUMENT: 'Document',
  CAD: 'CAO',
  SCAN: 'Scan',
  OTHER: 'Autre',
};

export function getAttachmentKindLabel(kind: AttachmentKind): string {
  return ATTACHMENT_KIND_LABELS[kind] ?? kind;
}

/**
 * Catégories auto-parts (E6-S08) — R.5.18.
 * `autoCategory` (pas `category`) — collision évitée
 * avec la relation `PartCategory` sur `Part`.
 * Focus plastique (D6 E6-S05) : body, interior, exterior.
 */
export const AUTO_CATEGORY_LABELS: Record<string, string> = {
  body: 'Carrosserie',
  interior: 'Intérieur',
  exterior: 'Extérieur',
  mechanical: 'Mécanique',
};

export function getAutoCategoryLabel(category: string): string {
  return AUTO_CATEGORY_LABELS[category] ?? category;
}

/**
 * Matières plastique auto-parts (E6-S08) — focus plastique (D6).
 * Sous-ensemble cohérent avec `materials` (`src/i18n/fr.ts`).
 */
export const AUTO_MATERIAL_LABELS: Record<string, string> = {
  ABS: 'ABS (acrylonitrile butadiène styrène)',
  'ABS/PC': 'ABS/PC (mélange ABS/polycarbonate)',
  PP: 'PP (polypropylène)',
  PC: 'PC (polycarbonate)',
  PA: 'PA (polyamide / nylon)',
  PUR: 'PUR (polyuréthane)',
  TPO: 'TPO (polyoléfine thermoplastique)',
};

export function getAutoMaterialLabel(material: string): string {
  return AUTO_MATERIAL_LABELS[material] ?? material;
}
