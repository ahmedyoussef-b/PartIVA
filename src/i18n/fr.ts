import type { Material } from '@/schemas/part'
import type { RequestStatus, RequestUrgency } from '@/schemas/request'
import type { SearchSource } from '@/schemas/search'

export const FR = {
  app: {
    name: 'Atelier Pièces Industrielles',
    tagline: 'Fabrication de pièces de rechange techniques en plastique à la demande',
    location: 'Tunisie (Sfax & Tunis)',
    phone: '+216 74 123 456',
    email: 'contact@atelier-pieces.tn',
  },
  materials: {
    'POM-C': 'Polyoxyméthylène Copolymère (Acétal / Delrin)',
    'POM-H': 'Polyoxyméthylène Homopolymère',
    'PA6': 'Polyamide 6 (Nylon standard usinage)',
    'PA66': 'Polyamide 6.6 (Haute rigidité)',
    'PEHD': 'Polyéthylène Haute Densité (PE-HD / PE300)',
    'PEBD': 'Polyéthylène Basse Densité',
    'PTFE': 'Polytétrafluoroéthylène (Téflon haute T° & inertie)',
    'UHMW-PE': 'Polyéthylène Masse Molaire Très Élevée (PE1000 - Glissement extrême)',
    'PVC': 'Polychlorure de vinyle rigide',
    'PEEK': 'Polyétheréthercétone (Plastique ultra-haute performance)',
    'ABS': 'Acrylonitrile Butadiène Styrène',
    'PETP': 'Polyéthylène Téréphtalate',
  } satisfies Record<Material, string>,
  statuses: {
    new: 'Nouvelle demande',
    searching: 'Recherche multi-sources',
    candidate_found: 'Candidat identifié (≥ 70%)',
    reverse_engineering: 'Rétro-ingénierie CAO',
    validated: 'Validée pour usinage',
    machining: 'Usinage CNC en cours',
    completed: 'Terminée & Contrôlée',
    archived: 'Archivée',
    rejected: 'Refusée',
  } satisfies Record<RequestStatus, string>,
  partStatuses: {
    draft: 'Brouillon',
    validated: 'Validée',
    deprecated: 'Obsolète',
  },
  urgencies: {
    low: 'Standard (7-10 jours ouvrés)',
    normal: 'Normale (4-6 jours ouvrés)',
    high: 'Haute (48-72h)',
    critical: 'Critique / Arrêt de ligne usine (24h)',
  } satisfies Record<RequestUrgency, string>,
  searchSources: {
    local_db: 'Base de données locale (Atelier)',
    traceparts: 'TraceParts Online (CAD Standard)',
    cadenas: 'CADENAS PartSolutions',
    manufacturer_catalog: 'Catalogues constructeurs indexés',
    geometric_search: 'Recherche géométrique 3D / IA',
  } satisfies Record<SearchSource, string>,
  steps: {
    identification: '1. Identification client',
    machine: '2. Machine & Contexte',
    part: '3. Description de la pièce',
    photos: '4. Photos & Prises de vue',
    quantity: '5. Quantité & Délais',
    summary: '6. Récapitulatif & Soumission',
  },
} as const
