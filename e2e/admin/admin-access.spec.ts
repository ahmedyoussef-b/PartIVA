/**
 * Admin role access tests — static routes only.
 * ADMIN: ALLOW everywhere. Handles page-level redirects via finalPath.
 *
 * Dynamic [id] routes are tested in admin-dynamic.spec.ts.
 */

import { test, expect } from '@playwright/test';
import { accessMatrix } from '../fixtures/access-matrix';

function urlPattern(path: string): RegExp {
  return new RegExp(`${path.replace(/\//g, '\\/')}$`);
}

const staticRoutes = accessMatrix.filter((route) => route.dynamicId === undefined);

for (const route of staticRoutes) {
  if (route.ADMIN !== 'ALLOW') continue;

  test(`ADMIN → ${route.path} is allowed`, async ({ page }) => {
    await page.goto(route.path);
    const expectedUrl = route.finalPath ?? route.path;
    await expect(page).toHaveURL(urlPattern(expectedUrl));
  });
}
