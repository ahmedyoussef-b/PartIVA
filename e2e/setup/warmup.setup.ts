/**
 * Warmup setup — pre-warms Next.js dev server routes.
 *
 * Runs as a Playwright project BEFORE the auth setup, via dependencies.
 * Visits critical routes once and waits for network idle to force
 * compilation. No trailing wait: the last networkidle guarantees the
 * dev server has settled before downstream projects run.
 *
 * Unlike the previous globalSetup, this runs as a regular test project
 * so Playwright sequences it correctly (before auth setup).
 *
 * Global timeout is set to 120s (4x the observed 30s consumption) to
 * absorb cold-cache compilation variability.
 */

import { test as warmup } from '@playwright/test';

warmup.setTimeout(120_000);

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
});
