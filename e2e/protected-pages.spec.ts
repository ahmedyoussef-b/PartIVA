import { test, expect } from '@playwright/test';

const PROTECTED_ROUTES = [
  '/admin/audit',
  '/admin/dashboard',
  '/admin/demandes',
  '/admin/machines',
  '/admin/materiaux',
  '/admin/parametres',
  '/admin/pieces',
  '/admin/reverse-engineering',
  '/admin/sync',
  '/admin/usinage',
  '/client/dashboard',
  '/client/dashboard/demandes',
  '/client/dashboard/notifications',
  '/client/dashboard/pieces-pretes',
];

for (const route of PROTECTED_ROUTES) {
  test(`protected: ${route} redirects when unauthenticated`, async ({ request }) => {
    const response = await request.get(route, { maxRedirects: 0 });
    expect([301, 302, 307, 308]).toContain(response.status());
  });
}
