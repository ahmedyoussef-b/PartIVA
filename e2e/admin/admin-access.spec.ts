/**
 * Admin role access tests.
 * ADMIN: ALLOW everywhere. Handles page-level redirects via finalPath.
 */

import { test, expect } from '@playwright/test';
import { accessMatrix } from '../fixtures/access-matrix';

function urlPattern(path: string): RegExp {
  return new RegExp(`${path.replace(/\//g, '\\/')}$`);
}

for (const route of accessMatrix) {
  if (route.ADMIN !== 'ALLOW') continue;

  test(`ADMIN → ${route.path} is allowed`, async ({ page }) => {
    await page.goto(route.path);
    const expectedUrl = route.finalPath ?? route.path;
    await expect(page).toHaveURL(urlPattern(expectedUrl));
  });
}