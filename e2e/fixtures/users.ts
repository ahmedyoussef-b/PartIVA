/**
 * E2E test users — credentials from env with dev fallback.
 * Fallback values match prisma/seed.ts (documented in prompt de passation).
 */

export type Role = 'ADMIN' | 'USER' | 'VIEWER';

export interface TestUser {
  role: Role;
  email: string;
  password: string;
  storageStatePath: string;
}

export const users: Record<Role, TestUser> = {
  ADMIN: {
    role: 'ADMIN',
    email: process.env.E2E_ADMIN_EMAIL ?? 'admin@partiva.dev',
    password: process.env.E2E_ADMIN_PASSWORD ?? 'PartIVA-dev-2026!',
    storageStatePath: '.auth/admin.json',
  },
  USER: {
    role: 'USER',
    email: process.env.E2E_USER_EMAIL ?? 'user@partiva.dev',
    password: process.env.E2E_USER_PASSWORD ?? 'PartIVA-dev-2026!',
    storageStatePath: '.auth/user.json',
  },
  VIEWER: {
    role: 'VIEWER',
    email: process.env.E2E_VIEWER_EMAIL ?? 'viewer@partiva.dev',
    password: process.env.E2E_VIEWER_PASSWORD ?? 'PartIVA-dev-2026!',
    storageStatePath: '.auth/viewer.json',
  },
};