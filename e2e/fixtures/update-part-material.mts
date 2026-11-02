import 'dotenv/config';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const [partId, material] = process.argv.slice(2);

if (!partId || !material) {
  console.error('Usage: update-part-material.mts <partId> <material>');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const updated = await prisma.part.update({
    where: { id: partId },
    data: { material },
  });
  console.log(JSON.stringify({ id: updated.id, material: updated.material }));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
