import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = [
  '/',
  '/comment-ca-marche',
  '/contact',
  '/demande',
  '/demande/confirmation',
  '/forgot-password',
  '/login',
  '/materiaux',
  '/register',
  '/services',
  '/client/creer-piece',
  '/client/pieces-pretes',
];

for (const path of PUBLIC_PAGES) {
  test(`public: ${path} returns 200`, async ({ page: playwrightPage }) => {
    const response = await playwrightPage.goto(path);
    expect(response?.status()).toBe(200);
  });
}
