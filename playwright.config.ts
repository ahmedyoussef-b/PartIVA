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
  // Warmup — pre-warms Next.js dev server routes. Runs before auth setup.
  {
    name: 'warmup',
    testMatch: /warmup\.setup\.ts/,
  },

  // Setup — generates .auth/*.json. Runs after warmup.
  {
    name: 'setup',
    testMatch: /auth\.setup\.ts/,
    dependencies: ['warmup'],
  },

  // Existing 33 tests — unchanged, no auth.
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
    testIgnore: [/fixtures\//, /setup\//, /public\//, /admin\//, /user\//, /viewer\//],
    retries: 0,
  },

  // New role-based projects — matrix tests (written in E0-S07b-1-C).
  {
    name: 'public',
    use: { ...devices['Desktop Chrome'] },
    testDir: './e2e/public',
    dependencies: ['setup'],
    retries: 1,
  },
  {
    name: 'admin',
    use: {
      ...devices['Desktop Chrome'],
      storageState: '.auth/admin.json',
    },
    testDir: './e2e/admin',
    dependencies: ['setup'],
    retries: 1,
  },
  {
    name: 'user',
    use: {
      ...devices['Desktop Chrome'],
      storageState: '.auth/user.json',
    },
    testDir: './e2e/user',
    dependencies: ['setup'],
    retries: 1,
  },
  {
    name: 'viewer',
    use: {
      ...devices['Desktop Chrome'],
      storageState: '.auth/viewer.json',
    },
    testDir: './e2e/viewer',
    dependencies: ['setup'],
    retries: 1,
  },
],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
