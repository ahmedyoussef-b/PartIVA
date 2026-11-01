import type { Machine } from '@/generated/prisma/client';

export type RecommendationInput = {
  part: {
    material?: string | null;
    autoCategory?: string | null;
    machineId?: string | null;
    specifications?: { key: string; value: string }[];
  };
  machines: Machine[];
};

export type RecommendationResult = {
  machine: Machine | null;
  score: 'haute' | 'moyenne' | 'faible';
  reasons: string[];
  alreadyAssigned: boolean;
};

const PLASTICS = ['POM', 'PTFE', 'PEEK', 'UHMW', 'PA6', 'PA66', 'PEHD'];
const METALS = ['ACIER', 'ALU', 'INOX', 'TITANE', 'LAITON'];

export function recommendMachine(input: RecommendationInput): RecommendationResult {
  const { part, machines } = input;

  // 1. Filtrer les machines indisponibles
  const availableMachines = machines.filter(
    (m) => m.status !== 'MAINTENANCE' && m.status !== 'OFFLINE',
  );

  // 2. Si la pièce a déjà une machine assignée
  if (part.machineId) {
    const assigned = machines.find((m) => m.id === part.machineId);
    if (assigned) {
      return {
        machine: assigned,
        score: 'haute',
        reasons: ['Machine déjà assignée à cette pièce'],
        alreadyAssigned: true,
      };
    }
  }

  // 3. Données insuffisantes
  const hasSpecs = part.specifications && part.specifications.length > 0;
  if (!part.material && !hasSpecs) {
    return {
      machine: null,
      score: 'faible',
      reasons: ['Données insuffisantes (matériau et spécifications vides)'],
      alreadyAssigned: false,
    };
  }

  const materialUpper = (part.material || '').toUpperCase();
  const isPlastic = PLASTICS.some((p) => materialUpper.includes(p));
  const isMetal = METALS.some((m) => materialUpper.includes(m));
  const autoCatLower = (part.autoCategory || '').toLowerCase();
  const hasDiameter = part.specifications?.some((s) => s.key.toLowerCase().includes('diameter'));
  const hasAngle = part.specifications?.some((s) => s.key.toLowerCase().includes('angle'));

  let recommendedType: string | null = null;
  const reasons: string[] = [];

  if (isPlastic) {
    if (autoCatLower.includes('prototype') || autoCatLower.includes('petite série')) {
      recommendedType = 'PRINTER_3D';
      reasons.push('Matériau plastique + catégorie prototype/petite série → Impression 3D');
    } else {
      recommendedType = 'CNC';
      reasons.push('Matériau plastique → Fraisage CNC');
    }
  } else if (isMetal) {
    if (hasDiameter || hasAngle) {
      recommendedType = 'LATHE';
      reasons.push('Matériau métallique + spécifications de diamètre/angle → Tournage');
    } else {
      recommendedType = 'CNC';
      reasons.push('Matériau métallique → Fraisage CNC');
    }
  }

  if (!recommendedType) {
    return {
      machine: null,
      score: 'faible',
      reasons: ['Impossible de déterminer le type de machine (matériau non reconnu)'],
      alreadyAssigned: false,
    };
  }

  // 4. Chercher la machine correspondante
  const candidate = availableMachines.find((m) => m.type === recommendedType);

  if (!candidate) {
    return {
      machine: null,
      score: 'faible',
      reasons: [...reasons, `Aucune machine ${recommendedType} disponible`],
      alreadyAssigned: false,
    };
  }

  return {
    machine: candidate,
    score: reasons.length > 1 ? 'haute' : 'moyenne',
    reasons,
    alreadyAssigned: false,
  };
}
