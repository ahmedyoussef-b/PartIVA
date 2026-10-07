// NOTE: MOCK_SEARCH_CANDIDATES, INITIAL_REQUESTS and WORKSHOP_MACHINES
// sont conservés car encore utilisés par :
// - MOCK_SEARCH_CANDIDATES : /api/search et /admin/demandes/[id]/recherche
// - INITIAL_REQUESTS : tableaux de bord admin/client et pages usinage/sync
// - WORKSHOP_MACHINES : tableaux de bord admin et page usinage
// MATERIALS_CATALOG et INITIAL_PARTS ont été supprimés en E0-S04-5
// (domaines Materials et Parts branchés sur Prisma).

import type { Request } from '@/schemas/request';
import type { SearchCandidate } from '@/schemas/search';

export const INITIAL_REQUESTS: Request[] = [
  {
    id: 'a1111111-2222-3333-4444-555555555551',
    cloudId: 1042,
    client: {
      name: 'Ahmed Abbes',
      email: 'ahmedabbes@gmail.com',
      company: 'PartIVA',
      phone: '+216 27 803 761',
    },
    machineRef: 'Ligne TetraPak A3/Flex #02',
    partDescription:
      'Étoile de transfert bouteilles 1L cassée suite à un bourrage. Les alvéoles de guidage sont fissurées. Pièce d’origine introuvable avant 6 semaines chez le constructeur étranger.',
    partFunction: 'Sélection et cadencement synchronisé des bouteilles vers l’encaisseuse.',
    suspectedMaterial: 'UHMW-PE',
    quantity: 4,
    urgency: 'critical',
    photos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'searching',
    createdAt: '2026-10-04T16:30:00Z',
    updatedAt: '2026-10-04T16:30:00Z',
  },
  {
    id: 'a1111111-2222-3333-4444-555555555552',
    cloudId: 1041,
    client: {
      name: 'Youssef Abbes',
      email: 'youssefabbes@gmail.com',
      company: 'SITEX',
      phone: '+216 73 345 678',
    },
    machineRef: 'Métier à tisser Picanol OptiMax',
    partDescription:
      'Coulisseau de commande de cadre usé prématurément par abrasion. Frottement métal/plastique. Besoin d’un plastique autolubrifiant avec forte tenue thermique.',
    partFunction: 'Guidage alternatif linéaire haute fréquence (600 coups/min).',
    suspectedMaterial: 'POM-C',
    quantity: 12,
    urgency: 'high',
    photos: [
      'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'candidate_found',
    createdAt: '2026-10-04T11:15:00Z',
    updatedAt: '2026-10-04T14:20:00Z',
  },
  {
    id: 'a1111111-2222-3333-4444-555555555553',
    cloudId: 1039,
    client: {
      name: 'Sami Triki',
      email: 'sami.triki@cho-oil.com',
      company: 'CHO Huile d’Olive Sfax',
      phone: '+216 74 890 123',
    },
    machineRef: 'Décanteur centrifuge Pieralisi',
    partDescription:
      'Bague d’étanchéité de sortie huile végétale. La pièce existante s’est déformée sous la chaleur (85°C) et les acides gras libres.',
    partFunction: 'Joint labyrinthe tournant sans contact agressif.',
    suspectedMaterial: 'PTFE',
    quantity: 2,
    urgency: 'normal',
    photos: [
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'reverse_engineering',
    createdAt: '2026-10-03T18:00:00Z',
    updatedAt: '2026-10-04T09:40:00Z',
  },
  {
    id: 'a1111111-2222-3333-4444-555555555554',
    cloudId: 1038,
    client: {
      name: 'Nadia Trabelsi',
      email: 'n.trabelsi@stip-pneus.tn',
      company: 'STIP Pneus M’saken',
      phone: '+216 73 999 111',
    },
    machineRef: 'Boudineuse mélangeur caoutchouc',
    partDescription:
      'Patin d’usure sous chariot de translation. Pièce usée jusqu’à la fixation métallique.',
    partFunction: 'Support de charge dynamique 500 kg en translation continue.',
    suspectedMaterial: 'PA66',
    quantity: 6,
    urgency: 'low',
    photos: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'machining',
    partId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    createdAt: '2026-10-02T10:00:00Z',
    updatedAt: '2026-10-04T08:00:00Z',
  },
];

export const MOCK_SEARCH_CANDIDATES: SearchCandidate[] = [
  {
    id: 'cand-1',
    source: 'local_db',
    reference: 'PL-004812',
    name: 'Pignon d’entraînement POM-C 24 dents',
    manufacturer: 'Atelier Usinage Sfax (Archives)',
    imageUrl:
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
    cadAvailable: true,
    datasheetAvailable: true,
    scores: {
      global: 0.88,
      geometry: 0.92,
      dimensions: 0.85,
      material: 0.9,
    },
    metadata: {
      usinageTime: '45 min',
      matiereBrute: 'Barre ronde POM-C Ø90 mm',
    },
  },
  {
    id: 'cand-2',
    source: 'traceparts',
    reference: 'TP-948210-EN',
    name: 'Spur Gear Module 2.5 - 24 Teeth',
    manufacturer: 'KHK Standard Gears Inc.',
    imageUrl:
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80',
    cadAvailable: true,
    datasheetAvailable: true,
    scores: {
      global: 0.76,
      geometry: 0.82,
      dimensions: 0.74,
      material: 0.7,
    },
    metadata: {
      standard: 'DIN 867',
      stepFileUrl: 'https://traceparts.com/export/step/TP-948210.step',
    },
  },
  {
    id: 'cand-3',
    source: 'cadenas',
    reference: 'CAD-MISUMI-GEAR-84',
    name: 'Polyacetal Spur Gear Hub Type A',
    manufacturer: 'Misumi Industrial Europe',
    imageUrl:
      'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=400&q=80',
    cadAvailable: true,
    datasheetAvailable: false,
    scores: {
      global: 0.71,
      geometry: 0.75,
      dimensions: 0.69,
      material: 0.85,
    },
  },
  {
    id: 'cand-4',
    source: 'geometric_search',
    reference: 'GEO-CLUSTER-591',
    name: 'Modèle similaire géométrie rotative crantée',
    manufacturer: 'Index 3D IA Local',
    imageUrl:
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
    cadAvailable: true,
    datasheetAvailable: false,
    scores: {
      global: 0.64,
      geometry: 0.68,
      dimensions: 0.6,
      material: 0.5,
    },
  },
];

export const WORKSHOP_MACHINES = [
  {
    id: 'mach-1',
    name: 'Tour CNC 3 axes Haas ST-20',
    type: 'Tournage CNC haute précision',
    capacity: 'Ø Max 330 mm × Longueur 570 mm',
    status: 'active',
    currentJob: 'Usinage bague POM-C (PL-004812)',
    loadPercent: 78,
  },
  {
    id: 'mach-2',
    name: 'Centre d’usinage 5 axes DMG Mori DMU 50',
    type: 'Fraisage 5 axes simultanés',
    capacity: 'Courses 500 × 450 × 400 mm (Tolérance ±5 µm)',
    status: 'active',
    currentJob: 'Fraisage étoile PE1000',
    loadPercent: 92,
  },
  {
    id: 'mach-3',
    name: 'Fraiseuse conventionnelle Vernier FV-3',
    type: 'Usinage mécanique & ébauches',
    capacity: 'Table 1300 × 300 mm',
    status: 'idle',
    currentJob: 'Prêt pour ébauche',
    loadPercent: 20,
  },
  {
    id: 'mach-4',
    name: 'Machine de mesure tridimensionnelle (MMT) Mitutoyo',
    type: 'Métrologie & contrôle qualité certifié',
    capacity: 'Précision 1.7 µm + L/300',
    status: 'active',
    currentJob: 'Contrôle dimensionnel lot PL-004813',
    loadPercent: 65,
  },
];
