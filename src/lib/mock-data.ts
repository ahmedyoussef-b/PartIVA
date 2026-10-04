import type { Part } from '@/schemas/part'
import type { Request } from '@/schemas/request'
import type { SearchCandidate } from '@/schemas/search'

export interface MaterialDetail {
  slug: string
  code: string
  name: string
  category: string
  density: number // g/cm³
  maxTemp: number // °C
  tensileStrength: number // MPa
  hardness: string // Shore D or Rockwell
  frictionCoefficient: number
  resistanceChemical: 'Excellente' | 'Bonne' | 'Moyenne' | 'Faible'
  foodGrade: boolean
  description: string
  advantages: string[]
  commonApplications: string[]
}

export const MATERIALS_CATALOG: MaterialDetail[] = [
  {
    slug: 'pom-c',
    code: 'POM-C',
    name: 'Polyoxyméthylène Copolymère (Acétal / Delrin)',
    category: 'Thermostable technique',
    density: 1.41,
    maxTemp: 100,
    tensileStrength: 65,
    hardness: '82 Shore D',
    frictionCoefficient: 0.25,
    resistanceChemical: 'Excellente',
    foodGrade: true,
    description:
      'Le POM-C offre une excellente stabilité dimensionnelle, une très faible absorption d’humidité et un usinage aisé. C’est le plastique de référence pour les pièces de précision.',
    advantages: [
      'Stabilité dimensionnelle exceptionnelle',
      'Faible coefficient de frottement',
      'Excellente usinabilité aux tolérances serrées (ISO 2768)',
      'Agrément contact alimentaire FDA / CE 1935/2004',
    ],
    commonApplications: [
      'Pignons et engrenages silencieux',
      'Bagues de guidage et coussinets',
      'Raccords et vannes pour l’agroalimentaire',
      'Cames et composants de distributeurs',
    ],
  },
  {
    slug: 'uhmw-pe',
    code: 'UHMW-PE',
    name: 'Polyéthylène Haute Masse Molaire (PE1000)',
    category: 'Plastique à très haute résistance à l’usure',
    density: 0.93,
    maxTemp: 80,
    tensileStrength: 25,
    hardness: '64 Shore D',
    frictionCoefficient: 0.12,
    resistanceChemical: 'Excellente',
    foodGrade: true,
    description:
      'Le PE1000 possède une résistance à l’abrasion inégalée et un coefficient de frottement ultra-bas. Indispensable pour les lignes de convoyage et de conditionnement.',
    advantages: [
      'Résistance extrême aux chocs et à l’abrasion',
      'Auto-lubrifiant, glissement optimal sans graisse',
      'Inerte aux produits chimiques et solvants',
      'Absorption d’eau quasi-nulle (< 0.01%)',
    ],
    commonApplications: [
      'Guides de chaînes de convoyeurs',
      'Plaques d’usure pour silos et trémies',
      'Étoiles de sélection pour embouteillage',
      'Racleurs et profils de glissement',
    ],
  },
  {
    slug: 'ptfe',
    code: 'PTFE',
    name: 'Polytétrafluoroéthylène (Téflon)',
    category: 'Fluoropolymère haute température',
    density: 2.16,
    maxTemp: 260,
    tensileStrength: 28,
    hardness: '55 Shore D',
    frictionCoefficient: 0.04,
    resistanceChemical: 'Excellente',
    foodGrade: true,
    description:
      'Le PTFE combine une plage thermique extrême (-200°C à +260°C) et la résistance chimique la plus élevée du marché. Idéal pour l’industrie chimique et pharmaceutique.',
    advantages: [
      'Plage de température extrême (-200°C à +260°C)',
      'Le plus bas coefficient de frottement connu',
      'Inertie chimique quasi-totale',
      'Propriétés anti-adhérentes absolues',
    ],
    commonApplications: [
      'Sièges de vannes et garnitures d’étanchéité',
      'Joints toriques pour fluides corrosifs',
      'Isolateurs haute fréquence',
      'Paliers fonctionnant en milieu agressif',
    ],
  },
  {
    slug: 'pa6',
    code: 'PA6',
    name: 'Polyamide 6 (Nylon)',
    category: 'Thermoplastique résistant aux chocs',
    density: 1.14,
    maxTemp: 90,
    tensileStrength: 78,
    hardness: '80 Shore D',
    frictionCoefficient: 0.32,
    resistanceChemical: 'Bonne',
    foodGrade: false,
    description:
      'Le PA6 coulé ou extrudé est réputé pour sa ténacité, sa capacité d’amortissement des vibrations et sa grande résistance à la rupture.',
    advantages: [
      'Grande résistance mécanique et rigidité',
      'Fort pouvoir d’amortissement des chocs',
      'Bonne tenue à la fatigue',
      'Résistance aux huiles, carburants et graisses',
    ],
    commonApplications: [
      'Galets de roulement pour manutention',
      'Poulies pour câbles et courroies',
      'Douilles et éléments d’accouplement',
      'Rondelles de calage pour presses industrielles',
    ],
  },
  {
    slug: 'pehd',
    code: 'PEHD',
    name: 'Polyéthylène Haute Densité (PE300 / PE500)',
    category: 'Polyoléfine polyvalente',
    density: 0.95,
    maxTemp: 80,
    tensileStrength: 30,
    hardness: '65 Shore D',
    frictionCoefficient: 0.22,
    resistanceChemical: 'Bonne',
    foodGrade: true,
    description:
      'Économique et résistant à l’impact, le PEHD convient particulièrement aux cuves, bacs et outillages de coupe agroalimentaires.',
    advantages: [
      'Très bon rapport qualité / prix',
      'Légèreté et soudabilité facile',
      'Résistance aux chocs même à basse température',
      'Conforme contact alimentaire',
    ],
    commonApplications: [
      'Planches de découpe industrielles',
      'Bacs de rétention et cuves',
      'Guides de glissement basse charge',
      'Protections de parois et butées',
    ],
  },
  {
    slug: 'peek',
    code: 'PEEK',
    name: 'Polyétheréthercétone (Ultra-Performance)',
    category: 'Polymère technique de pointe',
    density: 1.32,
    maxTemp: 250,
    tensileStrength: 100,
    hardness: '85 Shore D',
    frictionCoefficient: 0.28,
    resistanceChemical: 'Excellente',
    foodGrade: true,
    description:
      'Le PEEK est un plastique haute performance remplaçant avantageusement l’inox ou le bronze sous contraintes mécaniques et thermiques sévères.',
    advantages: [
      'Résistance thermique continue jusqu’à 250°C',
      'Résistance mécanique équivalente à certains métaux',
      'Stérilisable à la vapeur sans dégradation',
      'Excellente résistance aux rayonnements',
    ],
    commonApplications: [
      'Clapets de compresseurs haute pression',
      'Composants de pompes pétrochimiques',
      'Pignons pour environnements stériles',
      'Connecteurs électroniques aéronautiques',
    ],
  },
]

export const INITIAL_PARTS: Part[] = [
  {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    reference: 'PL-004812',
    name: 'Pignon conique d’entraînement étiqueteuse',
    description: 'Pignon à denture hélicoïdale 24 dents pour ligne d’embouteillage agroalimentaire.',
    material: 'POM-C',
    dimensions: {
      diameter: 84.5,
      height: 32.0,
      weight: 185,
    },
    tolerances: { 'Alésage axe': 'H7 (+0.015 / 0)', 'Épaisseur denture': '±0.05 mm' },
    version: 'V2',
    status: 'validated',
    files: {
      cad: ['/models/pignon-conique.glb'],
      plans: ['/plans/PL-004812-plan.pdf'],
      photos: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'],
    },
    createdAt: '2026-08-14T09:30:00Z',
    updatedAt: '2026-09-02T14:15:00Z',
  },
  {
    id: '7b83d1c4-91fa-4e78-8314-b6a1e948c21a',
    reference: 'PL-004813',
    name: 'Bague de frottement auto-lubrifiante',
    description: 'Boussole de glissement pour broche textile, travail à sec sans graissage.',
    material: 'UHMW-PE',
    dimensions: {
      diameter: 50.0,
      length: 45.0,
      weight: 62,
    },
    tolerances: { 'Diamètre intérieur': 'E9', 'Concentricité': '0.02 mm' },
    version: 'V1',
    status: 'validated',
    files: {
      cad: ['/models/bague-frottement.glb'],
      plans: ['/plans/PL-004813-plan.pdf'],
      photos: ['https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'],
    },
    createdAt: '2026-09-01T11:20:00Z',
    updatedAt: '2026-09-01T11:20:00Z',
  },
  {
    id: '9c2f6d81-35b8-4c19-9831-d820fa63b901',
    reference: 'PL-004814',
    name: 'Siège de clapet anti-retour haute température',
    description: 'Composant d’étanchéité pour autoclave de stérilisation conserves.',
    material: 'PTFE',
    dimensions: {
      diameter: 110.0,
      height: 18.0,
      weight: 120,
    },
    tolerances: { 'Planéité portée': '0.01 mm' },
    version: 'V1',
    status: 'validated',
    files: {
      cad: ['/models/siege-clapet.glb'],
      plans: ['/plans/PL-004814-plan.pdf'],
      photos: ['https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80'],
    },
    createdAt: '2026-09-15T15:40:00Z',
    updatedAt: '2026-09-18T10:00:00Z',
  },
  {
    id: '3d91ae25-27a1-4fc3-a9c0-e71c84b12634',
    reference: 'PL-004815',
    name: 'Galet de guidage pour chaîne transporteuse',
    description: 'Galet à gorge en V pour convoyeur à palettes usine céramique.',
    material: 'PA6',
    dimensions: {
      diameter: 130.0,
      width: 40.0,
      weight: 340,
    },
    tolerances: { 'Gorge': '±0.1 mm' },
    version: 'V1',
    status: 'draft',
    files: {
      cad: [],
      plans: [],
      photos: ['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80'],
    },
    createdAt: '2026-10-02T08:15:00Z',
    updatedAt: '2026-10-02T08:15:00Z',
  },
]

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
]

export const MOCK_SEARCH_CANDIDATES: SearchCandidate[] = [
  {
    id: 'cand-1',
    source: 'local_db',
    reference: 'PL-004812',
    name: 'Pignon d’entraînement POM-C 24 dents',
    manufacturer: 'Atelier Usinage Sfax (Archives)',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
    cadAvailable: true,
    datasheetAvailable: true,
    scores: {
      global: 0.88,
      geometry: 0.92,
      dimensions: 0.85,
      material: 0.90,
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
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80',
    cadAvailable: true,
    datasheetAvailable: true,
    scores: {
      global: 0.76,
      geometry: 0.82,
      dimensions: 0.74,
      material: 0.70,
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
    imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=400&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
    cadAvailable: true,
    datasheetAvailable: false,
    scores: {
      global: 0.64,
      geometry: 0.68,
      dimensions: 0.60,
      material: 0.50,
    },
  },
]

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
]
