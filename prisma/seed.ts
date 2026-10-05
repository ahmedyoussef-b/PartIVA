import 'dotenv/config';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

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
  await prisma.partSupplier.deleteMany();
  await prisma.partImage.deleteMany();
  await prisma.partSpecification.deleteMany();
  await prisma.part.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.partCategory.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ───────────────────────────────────────────────────────────
  console.log('👤 Creating users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@partiva.dev',
      name: 'Marc Dubois',
      passwordHash: '$2b$10$placeholder.hash.for.dev.seed.only',
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@partiva.dev',
      name: 'Sophie Martin',
      passwordHash: '$2b$10$placeholder.hash.for.dev.seed.only',
      role: 'USER',
    },
  });

  const _viewer = await prisma.user.create({
    data: {
      email: 'viewer@partiva.dev',
      name: 'Thomas Bernard',
      passwordHash: '$2b$10$placeholder.hash.for.dev.seed.only',
      role: 'VIEWER',
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
      name: 'Roulement à billes SKF 6205-2RS',
      description: 'Roulement rigide à billes, joints 2RS, dimensions 25x52x15 mm',
      status: 'ACTIVE',
      categoryId: roulementsABilles.id,
    },
  });

  const part2 = await prisma.part.create({
    data: {
      partNumber: 'SKF-6305-2RS',
      name: 'Roulement à billes SKF 6305-2RS',
      description: 'Roulement rigide à billes, joints 2RS, dimensions 62x130x31 mm',
      status: 'ACTIVE',
      categoryId: roulementsABilles.id,
    },
  });

  const part3 = await prisma.part.create({
    data: {
      partNumber: 'NSK-6206-2RS',
      name: 'Roulement à billes NSK 6206-2RS',
      description: 'Roulement rigide à billes, joints 2RS, dimensions 30x62x16 mm',
      status: 'ACTIVE',
      categoryId: roulementsABilles.id,
    },
  });

  const part4 = await prisma.part.create({
    data: {
      partNumber: 'ENG-M2-Z20',
      name: 'Engrenage droit module 2, 20 dents',
      description: 'Engrenage droit en acier, module 2, 20 dents, trou 12 mm',
      status: 'ACTIVE',
      categoryId: engrenages.id,
    },
  });

  const part5 = await prisma.part.create({
    data: {
      partNumber: 'SKF-7205-BEP',
      name: 'Roulement à contact oblique SKF 7205 BEP',
      description: 'Roulement à contact oblique, angle 40°, dimensions 25x52x15 mm',
      status: 'DRAFT',
      categoryId: roulements.id,
    },
  });

  // ── PartSpecifications ──────────────────────────────────────────────
  console.log('📏 Creating part specifications...');
  const specs = [
    { partId: part1.id, key: 'diameter_ext', value: '52', unit: 'mm' },
    { partId: part1.id, key: 'diameter_int', value: '25', unit: 'mm' },
    { partId: part1.id, key: 'width', value: '15', unit: 'mm' },
    { partId: part1.id, key: 'material', value: 'Acier trempé', unit: null },
    { partId: part1.id, key: 'weight', value: '95', unit: 'g' },
    { partId: part2.id, key: 'diameter_ext', value: '130', unit: 'mm' },
    { partId: part2.id, key: 'diameter_int', value: '62', unit: 'mm' },
    { partId: part2.id, key: 'width', value: '31', unit: 'mm' },
    { partId: part2.id, key: 'material', value: 'Acier cémenté', unit: null },
    { partId: part2.id, key: 'weight', value: '780', unit: 'g' },
    { partId: part3.id, key: 'diameter_ext', value: '62', unit: 'mm' },
    { partId: part3.id, key: 'diameter_int', value: '30', unit: 'mm' },
    { partId: part3.id, key: 'width', value: '16', unit: 'mm' },
    { partId: part3.id, key: 'material', value: 'Acier trempé', unit: null },
    { partId: part3.id, key: 'weight', value: '140', unit: 'g' },
    { partId: part4.id, key: 'module', value: '2', unit: 'mm' },
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
        order: 0,
      },
      {
        partId: part2.id,
        url: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800',
        altText: `Photo de ${part2.name}`,
        order: 0,
      },
      {
        partId: part3.id,
        url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800',
        altText: `Photo de ${part3.name}`,
        order: 0,
      },
      {
        partId: part4.id,
        url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800',
        altText: `Photo de ${part4.name}`,
        order: 0,
      },
      {
        partId: part1.id,
        url: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=800',
        altText: `Photo de ${part1.name} - vue latérale`,
        order: 1,
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
