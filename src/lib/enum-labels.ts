import type {
  AttachmentKind,
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
