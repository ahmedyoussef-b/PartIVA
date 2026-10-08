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
      dependencies: ['setup'],
      retries: 1,
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
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
