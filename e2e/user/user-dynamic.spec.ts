import { test, expect } from '../fixtures/dynamic-ids-fixture';
import { accessMatrix } from '../fixtures/access-matrix';
import { resolveId, type RouteAccessDynamicKey } from '../fixtures/dynamic-ids';

const dynamicRoutes = accessMatrix.filter((r) => r.dynamicId !== undefined);

for (const route of dynamicRoutes) {
  const key = route.dynamicId as RouteAccessDynamicKey;

  test(`USER ${route.USER} — ${route.path}`, async ({ page, dynamicIds }) => {
    const resolvedPath = route.path.replace('{id}', resolveId(dynamicIds, key));
    await page.goto(resolvedPath);

    if (route.USER === 'ALLOW') {
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator('body')).not.toContainText('Demande introuvable');
    } else {
      const target = route.redirectTo ?? '/';
      await expect(page).toHaveURL(new RegExp(target.replace(/\//g, '\\/')));
    }
  });
}
