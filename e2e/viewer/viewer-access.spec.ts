/**
 * Viewer role access tests.
 * VIEWER: ALLOW on public. DENY on /admin (→ /client → /) and
 * on /client (→ /). The middleware chain produces different final
 * URLs depending on the route — handled via redirectToViewer.
 */

import { test, expect } from '@playwright/test';
import { accessMatrix } from '../fixtures/access-matrix';

function urlPattern(path: string): RegExp {
  return new RegExp(`${path.replace(/\//g, '\\/')}$`);
}

for (const route of accessMatrix) {
  const expected = route.VIEWER;

  if (expected === 'ALLOW') {
    test(`VIEWER → ${route.path} is allowed`, async ({ page }) => {
      await page.goto(route.path);
      const expectedUrl = route.finalPath ?? route.path;
      await expect(page).toHaveURL(urlPattern(expectedUrl));
    });
  } else {
    const redirectTarget = route.redirectToViewer ?? route.redirectTo!;
    test(`VIEWER → ${route.path} redirects to ${redirectTarget}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(urlPattern(redirectTarget));
    });
  }
}