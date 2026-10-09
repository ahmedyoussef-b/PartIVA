import type { MachineType, MaterialCategory } from '@/generated/prisma/client';

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
