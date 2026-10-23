// E24-R2 — le process Playwright ne chargeait pas le `.env` : `process.env.ADMIN_PASSWORD`
// était `undefined` dans `e2e/fixtures/users.ts`, qui retombait alors sur le mot de passe
// mock 'PartIVA-dev-2026!' — différent du mot de passe réel seedé en production.
// Les setups USER/VIEWER échouaient en 401.
import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'warmup',
      testMatch: /warmup\.setup\.ts/,
    },
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      dependencies: ['warmup'],
    },
    {
      name: 'ids-setup',
      testMatch: /ids\.setup\.ts/,
      dependencies: ['warmup'],
    },
    {
      name: 'chromium',
      testIgnore: [/fixtures\//, /setup\//, /public\//, /admin\//, /user\//, /viewer\//],
      retries: 0,
    },
    {
      name: 'public',
      testDir: './e2e/public',
      use: { ...devices['Desktop Chrome'] },
      retries: 1,
      // E27 — cookie-guard.spec.ts lit .auth/admin.json sur disque (loadAdminStorageState).
      // Sans cette dépendance, le projet « public » s'exécutait AVANT le projet
      // « setup » (qui produit ce fichier) → ENOENT sur .auth/admin.json.
      dependencies: ['setup'],
    },
    {
      name: 'admin',
      testDir: './e2e/admin',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/admin.json' },
      dependencies: ['setup', 'ids-setup'],
      retries: 1,
    },
    {
      name: 'user',
      testDir: './e2e/user',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
      dependencies: ['setup', 'ids-setup'],
      retries: 1,
    },
    {
      name: 'viewer',
      testDir: './e2e/viewer',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/viewer.json' },
      dependencies: ['setup', 'ids-setup'],
      retries: 1,
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 180_000,
    env: {
      E2E_DISABLE_RATE_LIMIT: 'true',
      BETTER_AUTH_URL: 'http://localhost:3000',
    },
  },
});
