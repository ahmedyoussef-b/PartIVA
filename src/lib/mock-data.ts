// NOTE: MOCK_SEARCH_CANDIDATES
// sont conservés car encore utilisés par :
// - MOCK_SEARCH_CANDIDATES : /api/search et /admin/demandes/[id]/recherche
// MATERIALS_CATALOG et INITIAL_PARTS ont été supprimés en E0-S04-5
// (domaines Materials et Parts branchés sur Prisma).

import type { SearchCandidate } from '@/schemas/search';

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
