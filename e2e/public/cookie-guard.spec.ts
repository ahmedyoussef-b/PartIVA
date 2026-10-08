import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * E0-S07b-3-B — Cookie guard tests (T2 expired, T4 forged).
 *
 * D46: T2 manipulates an in-memory copy of admin storageState with a past
 * expires; T4 injects a forged session token. Neither touches .auth/*.json
 * on disk.
 *
 * Assertion: middleware redirects to /login when BetterAuth getSession
 * returns null (expired or invalid signature).
 */

const ADMIN_STATE_PATH = path.resolve('.auth/admin.json');
const SESSION_COOKIE_NAME = 'better-auth.session_token';

type StorageState = {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
  }>;
  origins: Array<{ origin: string; localStorage: Array<{ name: string; value: string }> }>;
};

function loadAdminStorageState(): StorageState {
  const raw = fs.readFileSync(ADMIN_STATE_PATH, 'utf-8');
  return JSON.parse(raw) as StorageState;
}

test.describe('Cookie guard — unauthenticated fallback', () => {
  test('T2 — expired session cookie redirects /admin and /client to /login', async ({ context, page }) => {
    const state = loadAdminStorageState();
    const sessionCookie = state.cookies.find((c) => c.name === SESSION_COOKIE_NAME);
    expect(sessionCookie, 'admin storageState must contain a session cookie').toBeDefined();

    const expiredCookie = {
      ...sessionCookie!,
      expires: Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
    };

    await context.addCookies([expiredCookie]);

    for (const target of ['/admin', '/client']) {
      await page.goto(target);
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('form')).toBeVisible();
    }
  });

  test('T4 — forged session cookie redirects /admin and /client to /login', async ({ context, page }) => {
    const state = loadAdminStorageState();
    const sessionCookie = state.cookies.find((c) => c.name === SESSION_COOKIE_NAME);
    expect(sessionCookie, 'admin storageState must contain a session cookie').toBeDefined();

    const forgedCookie = {
      ...sessionCookie!,
      value: 'forged.invalid.token.value',
    };

    await context.addCookies([forgedCookie]);

    for (const target of ['/admin', '/client']) {
      await page.goto(target);
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('form')).toBeVisible();
    }
  });
});
