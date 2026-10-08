/**
 * User role access tests — static routes only.
 * USER: ALLOW on public + /client, DENY on /admin (→ /client).
 *
 * Dynamic [id] routes are tested in user-dynamic.spec.ts.
 */

import { test, expect } from '@playwright/test';
import { accessMatrix } from '../fixtures/access-matrix';

function urlPattern(path: string): RegExp {
  return new RegExp(`${path.replace(/\//g, '\\/')}$`);
}

const staticRoutes = accessMatrix.filter((route) => route.dynamicId === undefined);

for (const route of staticRoutes) {
  const expected = route.USER;

  if (expected === 'ALLOW') {
    test(`USER → ${route.path} is allowed`, async ({ page }) => {
      await page.goto(route.path);
      const expectedUrl = route.finalPath ?? route.path;
      await expect(page).toHaveURL(urlPattern(expectedUrl));
    });
  } else {
    test(`USER → ${route.path} redirects to ${route.redirectTo}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(urlPattern(route.redirectTo!));
    });
  }
}
