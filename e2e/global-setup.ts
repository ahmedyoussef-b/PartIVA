import { config } from 'dotenv';
config({ path: '.env.test', override: true });

import { execSync } from 'node:child_process';

export default async function globalSetup() {
  const url = process.env.DATABASE_URL ?? '';
  if (!url.includes('localhost') || !url.includes('partiva_test')) {
    throw new Error('Refus : DATABASE_URL doit pointer vers localhost/partiva_test.');
  }
  process.env.DATABASE_URL_UNPOOLED = process.env.DATABASE_URL;
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  delete process.env.SHADOW_DATABASE_URL;
  console.log('[E101] Application des migrations sur la DB de test...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
  console.log('[E101] Seed de la DB de test...');
  execSync('npm run db:seed', { stdio: 'inherit', env: process.env });
  console.log('[E101] DB de test prête.');
}
