/**
 * Public (unauthenticated) access tests.
 * Verifies that protected routes redirect to /login when not authenticated.
 */

import { test, expect } from '@playwright/test';

const protectedRoutes = [
  '/admin/demandes',
  '/admin/reverse-engineering',
  '/client/dashboard',
  '/client/creer-piece',
  '/client/pieces-pretes',
];

for (const path of protectedRoutes) {
  test(`unauthenticated → ${path} redirects to /login`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  });
}

const publicRoutes = [
  '/',
  '/comment-ca-marche',
  '/contact',
  '/demande',
  '/materiaux',
  '/services',
  '/login',
  '/register',
  '/forgot-password',
];

for (const path of publicRoutes) {
  test(`unauthenticated → ${path} is accessible`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBeLessThan(400);
    await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}$`));
  });
}