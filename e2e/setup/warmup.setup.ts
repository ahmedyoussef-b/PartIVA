/**
 * Warmup setup — pre-warms Next.js dev server routes.
 *
 * Runs as a Playwright project BEFORE the auth setup, via dependencies.
 * Visits critical routes once and waits for network idle to force
 * compilation. Waits 2s at the end to let the dev server stabilize
 * before the auth setup begins.
 *
 * Unlike the previous globalSetup, this runs as a regular test project
 * so Playwright sequences it correctly (before auth setup).
 */

import { test as warmup, expect } from '@playwright/test';

const routesToWarm = [
  '/',
  '/materiaux',
  '/client/dashboard',
  '/client/creer-piece',
  '/client/pieces-pretes',
  '/admin/demandes',
  '/admin/reverse-engineering',
];

warmup('warm up dev server routes', async ({ page }) => {
  for (const route of routesToWarm) {
    try {
      await page.goto(route, {
        timeout: 60_000,
        waitUntil: 'networkidle',
      });
    } catch {
      // Swallow — middleware redirect may abort navigation; compilation
      // still occurred. We're warming the compiler, not asserting.
    }
  }
  // Let the dev server settle before auth setup runs.
  await page.waitForTimeout(2_000);
});
