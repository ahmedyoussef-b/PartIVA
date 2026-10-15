import { defineConfig, devices } from '@playwright/test';

/**
 * E8P-S08 — Tests E2E headless de l'UI desktop.
 * L'UI est servie statiquement (export Next.js) via `serve` sur le port 3100 —
 * les commandes Tauri (invoke) sont mockées par addInitScript dans chaque spec
 * (pas de binaire Tauri en headless).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx serve out -l 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
