import 'dotenv/config';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from 'better-auth/crypto';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const adapter = new PrismaPg(
  {
    connectionString,
    connectionTimeoutMillis: 30000,
  },
  {
    schema: 'public',
  },
);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // ── Cleanup (reverse dependency order) ──────────────────────────────
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.cadFile.deleteMany();
  await prisma.reverseEngineeringStep.deleteMany();
  await prisma.reverseEngineeringProject.deleteMany();
  await prisma.request.deleteMany();
  await prisma.partSupplier.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.partImage.deleteMany();
  await prisma.partSpecification.deleteMany();
  await prisma.part.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.partCategory.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.material.deleteMany();
  await prisma.user.deleteMany();
  await prisma.searchCandidate.deleteMany();

  // ── Users ───────────────────────────────────────────────────────────
  console.log('👤 Creating users...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@partiva.dev' },
    update: { name: 'Marc Dubois', role: 'ADMIN' },
    create: {
      email: 'admin@partiva.dev',
      name: 'Marc Dubois',
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@partiva.dev' },
    update: { name: 'Sophie Martin', role: 'USER' },
    create: {
      email: 'user@partiva.dev',
      name: 'Sophie Martin',
      role: 'USER',
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@partiva.dev' },
    update: { name: 'Thomas Bernard', role: 'VIEWER' },
    create: {
      email: 'viewer@partiva.dev',
      name: 'Thomas Bernard',
      role: 'VIEWER',
    },
  });

  const devPasswordHash = await hashPassword('PartIVA-dev-2026!');

  await prisma.account.upsert({
    where: { providerId_accountId: { providerId: 'credential', accountId: admin.id } },
    update: { password: devPasswordHash },
    create: {
      userId: admin.id,
      accountId: admin.id,
      providerId: 'credential',
      password: devPasswordHash,
    },
  });

  await prisma.account.upsert({
    where: { providerId_accountId: { providerId: 'credential', accountId: user.id } },
    update: { password: devPasswordHash },
    create: {
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: devPasswordHash,
    },
  });

  await prisma.account.upsert({
    where: { providerId_accountId: { providerId: 'credential', accountId: viewer.id } },
    update: { password: devPasswordHash },
    create: {
      userId: viewer.id,
      accountId: viewer.id,
      providerId: 'credential',
      password: devPasswordHash,
    },
  });

  // ── Materials ────────────────────────────────────────────────────────
  console.log('🧪 Creating materials...');
  await prisma.material.create({
    data: {
      slug: 'pom-c',
      code: 'POM-C',
      name: 'Polyoxyméthylène Copolymère (Acétal / Delrin)',
      category: 'THERMOSTABLE_TECHNIQUE',
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
  });

  await prisma.material.create({
    data: {
      slug: 'pa6-gf30',
      code: 'PA6-GF30',
      name: 'Polyamide 6 + 30% fibre de verre',
      category: 'THERMOPLASTIQUE_RENFORCE',
      density: 1.35,
      maxTemp: 120,
      tensileStrength: 150,
      hardness: 'M85 Rockwell',
      frictionCoefficient: 0.35,
      resistanceChemical: 'Bonne',
      foodGrade: false,
      description:
        'Le PA6-GF30 allie la ténacité du polyamide à la rigidité apportée par les fibres de verre. Idéal pour les structures soumises à des charges mécaniques importantes.',
      advantages: [
        'Haute rigidité et résistance mécanique',
        'Stabilité dimensionnelle sous charge',
        'Bonne résistance à la fatigue',
        'Retrait minimal en usinage',
      ],
      commonApplications: [
        'Supports structurels',
        'Carter et boîtiers techniques',
        'Pièces de fixation haute contrainte',
        'Moules industriels',
      ],
    },
  });

  await prisma.material.create({
    data: {
      slug: 'peek',
      code: 'PEEK',
      name: 'Polyétheréthercétone (Ultra-Performance)',
      category: 'POLYMERE_TECHNIQUE_POINT',
      density: 1.32,
      maxTemp: 250,
      tensileStrength: 100,
      hardness: 'M75 Rockwell',
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
  });

  await prisma.material.create({
    data: {
      slug: 'ptfe',
      code: 'PTFE',
      name: 'Polytétrafluoroéthylène (Téflon)',
      category: 'FLUOROPOLYMERE_HAUTE_TEMP',
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
  });

  await prisma.material.create({
    data: {
      slug: 'pehd',
      code: 'PEHD',
      name: 'Polyéthylène Haute Densité (PE300 / PE500)',
      category: 'POLYOLEFINE_POLYVALENTE',
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
  });

  // ── Machines ─────────────────────────────────────────────────────────
  console.log('🏭 Creating machines...');
  await prisma.machine.create({
    data: {
      code: 'CNC-01',
      name: 'Fraiseuse CNC 3 axes',
      type: 'CNC',
      status: 'RUNNING',
      location: 'Atelier A',
    },
  });

  await prisma.machine.create({
    data: {
      code: 'CNC-02',
      name: 'Fraiseuse CNC 5 axes',
      type: 'CNC',
      status: 'IDLE',
      location: 'Atelier A',
    },
  });

  await prisma.machine.create({
    data: {
      code: 'TOUR-01',
      name: 'Tour numérique',
      type: 'LATHE',
      status: 'IDLE',
      location: 'Atelier B',
    },
  });

  await prisma.machine.create({
    data: {
      code: 'IMP-01',
      name: 'Imprimante 3D industrielle',
      type: 'PRINTER_3D',
      status: 'MAINTENANCE',
      location: 'Atelier B',
    },
  });

  // ── PartCategories ──────────────────────────────────────────────────
  console.log('📁 Creating part categories...');
  const roulements = await prisma.partCategory.create({
    data: {
      name: 'Roulements',
      slug: 'roulements',
      description: 'Roulements à billes, à rouleaux et paliers',
    },
  });

  const engrenages = await prisma.partCategory.create({
    data: {
      name: 'Engrenages',
      slug: 'engrenages',
      description: 'Engrenages droits, hélicoïdaux et coniques',
    },
  });

  const roulementsABilles = await prisma.partCategory.create({
    data: {
      name: 'Roulements à billes',
      slug: 'roulements-a-billes',
      description: 'Roulements rigides à billes',
      parentId: roulements.id,
    },
  });

  // ── Suppliers ───────────────────────────────────────────────────────
  console.log('🏭 Creating suppliers...');
  const skfFr = await prisma.supplier.create({
    data: {
      name: 'SKF France',
      code: 'SKF-FR',
      email: 'contact@skf.fr',
      phone: '+33 1 23 45 67 89',
      website: 'https://www.skf.com/fr',
    },
  });

  const nskEu = await prisma.supplier.create({
    data: {
      name: 'NSK Europe',
      code: 'NSK-EU',
      email: 'europe@nsk.com',
      website: 'https://www.nsk.com',
    },
  });

  const schGrp = await prisma.supplier.create({
    data: {
      name: 'Schaeffler Group',
      code: 'SCH-GRP',
      website: 'https://www.schaeffler.com',
    },
  });

  // ── Parts ───────────────────────────────────────────────────────────
  console.log('🔩 Creating parts...');
  const part1 = await prisma.part.create({
    data: {
      partNumber: 'SKF-6205-2RS',
      ptvReference: 'PTV-2026-000001',
      name: 'Roulement à billes SKF 6205-2RS',
      description: 'Roulement rigide à billes, joints 2RS, dimensions 25x52x15 mm',
      status: 'ACTIVE',
      categoryId: roulementsABilles.id,
      clientId: user.id,
    },
  });

  const part2 = await prisma.part.create({
    data: {
      partNumber: 'SKF-6305-2RS',
      ptvReference: 'PTV-2026-000002',
      name: 'Roulement à billes SKF 6305-2RS',
      description: 'Roulement rigide à billes, joints 2RS, dimensions 62x130x31 mm',
      status: 'ACTIVE',
      categoryId: roulementsABilles.id,
      clientId: user.id,
    },
  });

  const part3 = await prisma.part.create({
    data: {
      partNumber: 'NSK-6206-2RS',
      ptvReference: 'PTV-2026-000003',
      name: 'Roulement à billes NSK 6206-2RS',
      description: 'Roulement rigide à billes, joints 2RS, dimensions 30x62x16 mm',
      status: 'ACTIVE',
      categoryId: roulementsABilles.id,
      clientId: user.id,
    },
  });

  const part4 = await prisma.part.create({
    data: {
      partNumber: 'ENG-M2-Z20',
      ptvReference: 'PTV-2026-000004',
      name: 'Engrenage droit module 2, 20 dents',
      description: 'Engrenage droit en acier, module 2, 20 dents, trou 12 mm',
      status: 'ACTIVE',
      categoryId: engrenages.id,
      clientId: user.id,
    },
  });

  const part5 = await prisma.part.create({
    data: {
      partNumber: 'SKF-7205-BEP',
      ptvReference: 'PTV-2026-000005',
      name: 'Roulement à contact oblique SKF 7205 BEP',
      description: 'Roulement à contact oblique, angle 40°, dimensions 25x52x15 mm',
      status: 'DRAFT',
      categoryId: roulements.id,
      clientId: user.id,
    },
  });

  // ── PartSpecifications ──────────────────────────────────────────────
  console.log('📏 Creating part specifications...');
  const specs = [
    { partId: part1.id, key: 'diameter_ext', value: '52', unit: 'mm', toleranceMax: 52.05, toleranceMin: 51.95 },
    { partId: part1.id, key: 'diameter_int', value: '25', unit: 'mm', toleranceMax: 25.02, toleranceMin: 24.98 },
    { partId: part1.id, key: 'width', value: '15', unit: 'mm' },
    { partId: part1.id, key: 'material', value: 'Acier trempé', unit: null },
    { partId: part1.id, key: 'weight', value: '95', unit: 'g' },
    { partId: part2.id, key: 'diameter_ext', value: '130', unit: 'mm', toleranceMax: 130.1, toleranceMin: 129.9 },
    { partId: part2.id, key: 'diameter_int', value: '62', unit: 'mm' },
    { partId: part2.id, key: 'width', value: '31', unit: 'mm' },
    { partId: part2.id, key: 'material', value: 'Acier cémenté', unit: null },
    { partId: part2.id, key: 'weight', value: '780', unit: 'g' },
    { partId: part3.id, key: 'diameter_ext', value: '62', unit: 'mm' },
    { partId: part3.id, key: 'diameter_int', value: '30', unit: 'mm' },
    { partId: part3.id, key: 'width', value: '16', unit: 'mm' },
    { partId: part3.id, key: 'material', value: 'Acier trempé', unit: null },
    { partId: part3.id, key: 'weight', value: '140', unit: 'g' },
    { partId: part4.id, key: 'module', value: '2', unit: 'mm', toleranceMax: 2.02, toleranceMin: 1.98 },
    { partId: part4.id, key: 'teeth', value: '20', unit: null },
    { partId: part4.id, key: 'bore', value: '12', unit: 'mm' },
    { partId: part4.id, key: 'material', value: 'Acier 42CrMo4', unit: null },
    { partId: part4.id, key: 'weight', value: '210', unit: 'g' },
    { partId: part5.id, key: 'diameter_ext', value: '52', unit: 'mm' },
    { partId: part5.id, key: 'diameter_int', value: '25', unit: 'mm' },
    { partId: part5.id, key: 'width', value: '15', unit: 'mm' },
    { partId: part5.id, key: 'contact_angle', value: '40', unit: '°' },
    { partId: part5.id, key: 'material', value: 'Acier trempé', unit: null },
  ];

  for (const spec of specs) {
    await prisma.partSpecification.create({
      data: spec,
    });
  }

  // ── PartImages ──────────────────────────────────────────────────────
  console.log('🖼️  Creating part images...');
  await prisma.partImage.createMany({
    data: [
      {
        partId: part1.id,
        url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800',
        altText: `Photo de ${part1.name}`,
        caption: 'Vue de face du roulement SKF 6205-2RS',
        order: 0,
        isPrimary: true,
      },
      {
        partId: part2.id,
        url: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800',
        altText: `Photo de ${part2.name}`,
        caption: 'Vue de face du roulement SKF 6305-2RS',
        order: 0,
        isPrimary: true,
      },
      {
        partId: part3.id,
        url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
        altText: `Photo de ${part3.name}`,
        caption: 'Vue de face du roulement NSK 6206-2RS',
        order: 0,
        isPrimary: true,
      },
      {
        partId: part4.id,
        url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800',
        altText: `Photo de ${part4.name}`,
        caption: 'Engrenage droit module 2, vue de face',
        order: 0,
        isPrimary: true,
      },
      {
        partId: part1.id,
        url: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=800',
        altText: `Photo de ${part1.name} - vue latérale`,
        caption: 'Vue latérale du roulement SKF 6205-2RS',
        order: 1,
        isPrimary: false,
      },
    ],
  });

  // ── Attachments ──────────────────────────────────────────────────
  console.log('📎 Creating part attachments...');
  await prisma.attachment.createMany({
    data: [
      {
        partId: part1.id,
        name: 'SKF-6205-2RS-fiche-technique.pdf',
        url: 'https://placeholder.dev/attachments/skf-6205-2rs-ft.pdf',
        fileType: 'PDF',
        mimeType: 'application/pdf',
        kind: 'DOCUMENT',
        sizeBytes: 245760,
      },
      {
        partId: part4.id,
        name: 'ENG-M2-Z20-modele-ca.step',
        url: 'https://placeholder.dev/attachments/eng-m2-z20.step',
        fileType: 'CAD_STEP',
        mimeType: 'application/step',
        kind: 'CAD',
        sizeBytes: 1048576,
      },
      {
        partId: part4.id,
        name: 'ENG-M2-Z20-scan-3d.stl',
        url: 'https://placeholder.dev/attachments/eng-m2-z20.stl',
        fileType: 'CAD_STL',
        mimeType: 'model/stl',
        kind: 'SCAN',
        sizeBytes: 2457600,
      },
    ],
  });

  // ── PartSuppliers ───────────────────────────────────────────────────
  console.log('🤝 Creating part-supplier relations...');
  await prisma.partSupplier.createMany({
    data: [
      { partId: part1.id, supplierId: skfFr.id, price: 12.5, leadTimeDays: 5 },
      { partId: part1.id, supplierId: schGrp.id, price: 11.8, leadTimeDays: 10 },
      { partId: part2.id, supplierId: skfFr.id, price: 45.0, leadTimeDays: 15 },
      { partId: part2.id, supplierId: schGrp.id, price: 42.3, leadTimeDays: 20 },
      { partId: part3.id, supplierId: nskEu.id, price: 15.2, leadTimeDays: 7 },
      { partId: part3.id, supplierId: skfFr.id, price: 16.0, leadTimeDays: 10 },
      { partId: part4.id, supplierId: schGrp.id, price: 28.9, leadTimeDays: 30 },
      { partId: part5.id, supplierId: skfFr.id, price: 18.5, leadTimeDays: 10 },
    ],
  });

  // ── ReverseEngineeringProjects ─────────────────────────────────────
  console.log('🔬 Creating reverse engineering projects...');
  const project1 = await prisma.reverseEngineeringProject.create({
    data: {
      name: 'Reverse engineering roulement SKF 6205',
      description: 'Analyse dimensionnelle et modélisation CAO du roulement SKF 6205-2RS',
      status: 'COMPLETED',
      partId: part1.id,
      userId: admin.id,
    },
  });

  const project2 = await prisma.reverseEngineeringProject.create({
    data: {
      name: 'Analyse engrenage module 2',
      description: "Reconception de l'engrenage droit module 2, 20 dents",
      status: 'IN_PROGRESS',
      partId: part4.id,
      userId: user.id,
    },
  });

  // ── Requests ────────────────────────────────────────────────────────
  console.log('📋 Creating requests...');
  await prisma.request.create({
    data: {
      clientId: user.id,
      partDescription:
        'Étoile de transfert bouteilles 1L cassée suite à un bourrage. Les alvéoles de guidage sont fissurées. Pièce d’origine introuvable avant 6 semaines chez le constructeur étranger.',
      partFunction: 'Sélection et cadencement synchronisé des bouteilles vers l’encaisseuse.',
      suspectedMaterial: 'UHMW-PE',
      quantity: 4,
      urgency: 'URGENT',
      status: 'IN_PROGRESS',
      photos: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
      ],
      projects: {
        connect: [{ id: project1.id }],
      },
    },
  });

  await prisma.request.create({
    data: {
      clientId: user.id,
      partDescription:
        'Coulisseau de commande de cadre usé prématurément par abrasion. Frottement métal/plastique. Besoin d’un plastique autolubrifiant avec forte tenue thermique.',
      partFunction: 'Guidage alternatif linéaire haute fréquence (600 coups/min).',
      suspectedMaterial: 'POM-C',
      quantity: 12,
      urgency: 'HIGH',
      status: 'REVIEW',
      photos: [
        'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80',
      ],
    },
  });

  await prisma.request.create({
    data: {
      clientId: viewer.id,
      partDescription:
        'Bague d’étanchéité de sortie huile végétale. La pièce existante s’est déformée sous la chaleur (85°C) et les acides gras libres.',
      partFunction: 'Joint labyrinthe tournant sans contact agressif.',
      suspectedMaterial: 'PTFE',
      quantity: 2,
      urgency: 'MEDIUM',
      status: 'PENDING',
      photos: [
        'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
      ],
    },
  });

  await prisma.request.create({
    data: {
      clientId: user.id,
      partDescription:
        'Patin d’usure sous chariot de translation. Pièce usée jusqu’à la fixation métallique.',
      partFunction: 'Support de charge dynamique 500 kg en translation continue.',
      suspectedMaterial: 'PA66',
      quantity: 6,
      urgency: 'LOW',
      status: 'COMPLETED',
      photos: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      ],
    },
  });

  // ── ReverseEngineeringSteps ────────────────────────────────────────
  console.log('📋 Creating reverse engineering steps...');
  await prisma.reverseEngineeringStep.createMany({
    data: [
      {
        projectId: project1.id,
        name: 'Scan 3D',
        description: 'Scan 3D de la pièce réelle',
        order: 0,
        completed: true,
      },
      {
        projectId: project1.id,
        name: 'Nettoyage maillage',
        description: 'Nettoyage du maillage brut',
        order: 1,
        completed: true,
      },
      {
        projectId: project1.id,
        name: 'Extraction dimensions',
        description: 'Extraction des dimensions clés',
        order: 2,
        completed: true,
      },
      {
        projectId: project1.id,
        name: 'Modélisation CAO',
        description: 'Modélisation CAO sous SolidWorks',
        order: 3,
        completed: true,
      },
      {
        projectId: project1.id,
        name: 'Validation',
        description: 'Validation par comparaison 3D',
        order: 4,
        completed: true,
      },
      {
        projectId: project2.id,
        name: 'Scan 3D',
        description: "Scan 3D de l'engrenage",
        order: 0,
        completed: true,
      },
      {
        projectId: project2.id,
        name: 'Nettoyage maillage',
        description: 'Nettoyage et réparation du maillage',
        order: 1,
        completed: true,
      },
      {
        projectId: project2.id,
        name: 'Modélisation CAO',
        description: 'Modélisation en cours',
        order: 2,
        completed: false,
      },
    ],
  });

  // ── CadFiles ────────────────────────────────────────────────────────
  console.log('📄 Creating CAD files...');
  await prisma.cadFile.create({
    data: {
      projectId: project1.id,
      name: 'SKF-6205-2RS.stl',
      url: 'https://placeholder.dev/cad/skf-6205-2rs.stl',
      fileType: 'CAD_STL',
      sizeBytes: 2457600,
    },
  });

  // ── AuditLogs ──────────────────────────────────────────────────────
  console.log('📝 Creating audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'create',
        entityType: 'Part',
        entityId: part1.id,
        metadata: { partNumber: part1.partNumber },
      },
      {
        userId: admin.id,
        action: 'create',
        entityType: 'Supplier',
        entityId: skfFr.id,
        metadata: { code: skfFr.code },
      },
      {
        userId: user.id,
        action: 'create',
        entityType: 'ReverseEngineeringProject',
        entityId: project2.id,
        metadata: { name: project2.name },
      },
    ],
  });

  // ── SearchCandidates ──────────────────────────────────────────────
  console.log('🔍 Creating search candidates...');
  await prisma.searchCandidate.deleteMany({
    where: { source: { in: ['local_db', 'traceparts', 'cadenas', 'geometric_search'] } },
  });
  await prisma.searchCandidate.createMany({
    data: [
      {
        source: 'local_db',
        reference: 'PL-004812',
        name: "Pignon d'entraînement POM-C 24 dents",
        manufacturer: 'Atelier Usinage Sfax (Archives)',
        imageUrl:
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
        cadAvailable: true,
        datasheetAvailable: true,
        scores: { global: 0.88, geometry: 0.92, dimensions: 0.85, material: 0.9 },
        metadata: { usinageTime: '45 min', matiereBrute: 'Barre ronde POM-C Ø90 mm' },
      },
      {
        source: 'traceparts',
        reference: 'TP-948210-EN',
        name: 'Spur Gear Module 2.5 - 24 Teeth',
        manufacturer: 'KHK Standard Gears Inc.',
        imageUrl:
          'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80',
        cadAvailable: true,
        datasheetAvailable: true,
        scores: { global: 0.76, geometry: 0.82, dimensions: 0.74, material: 0.7 },
        metadata: {
          standard: 'DIN 867',
          stepFileUrl: 'https://traceparts.com/export/step/TP-948210.step',
        },
      },
      {
        source: 'cadenas',
        reference: 'CAD-MISUMI-GEAR-84',
        name: 'Polyacetal Spur Gear Hub Type A',
        manufacturer: 'Misumi Industrial Europe',
        imageUrl:
          'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=400&q=80',
        cadAvailable: true,
        datasheetAvailable: false,
        scores: { global: 0.71, geometry: 0.75, dimensions: 0.69, material: 0.85 },
      },
      {
        source: 'geometric_search',
        reference: 'GEO-CLUSTER-591',
        name: 'Modèle similaire géométrie rotative crantée',
        manufacturer: 'Index 3D IA Local',
        imageUrl:
          'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
        cadAvailable: true,
        datasheetAvailable: false,
        scores: { global: 0.64, geometry: 0.68, dimensions: 0.6, material: 0.5 },
      },
    ],
  });

  // ── Summary ────────────────────────────────────────────────────────
  console.log('\n✅ Seed completed successfully!');
  console.log('─────────────────────────────────────────');

  const counts = {
    users: await prisma.user.count(),
    partCategories: await prisma.partCategory.count(),
    suppliers: await prisma.supplier.count(),
    parts: await prisma.part.count(),
    partSpecifications: await prisma.partSpecification.count(),
    partImages: await prisma.partImage.count(),
    partSuppliers: await prisma.partSupplier.count(),
    reverseEngineeringProjects: await prisma.reverseEngineeringProject.count(),
    reverseEngineeringSteps: await prisma.reverseEngineeringStep.count(),
    cadFiles: await prisma.cadFile.count(),
    auditLogs: await prisma.auditLog.count(),
    attachments: await prisma.attachment.count(),
    materials: await prisma.material.count(),
    machines: await prisma.machine.count(),
    requests: await prisma.request.count(),
    searchCandidates: await prisma.searchCandidate.count(),
  };

  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count}`);
  }

  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
