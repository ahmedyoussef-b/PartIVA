/**
 * Auth setup — runs once before role-based projects.
 * Logs in each role and persists storageState to .auth/<role>.json.
 */

import { test as setup, expect } from '@playwright/test';
import { users, type Role } from '../fixtures/users';

const roles: Role[] = ['ADMIN', 'USER', 'VIEWER'];

for (const role of roles) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    const user = users[role];

    // ---- AUTH SETUP: fail loudly if login fails ----
    try {
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(user.email);
      await page.getByLabel(/mot de passe/i).fill(user.password);
      await page.getByRole('button', { name: /connexion|se connecter|login/i }).click();
      await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
      await page.context().storageState({ path: user.storageStatePath });
    } catch (err) {
      // Log extra context before failing
      const contextInfo = await page.evaluate(() => {
        const el = document.querySelector('input[type=password]');
        return { hasLoginFields: !!el, body: document.body?.innerHTML?.slice(0, 200) };
      });
      console.error('AUTH SETUP FAILED for', user.role, {
        email: user.email,
        passwordSet: !!user.password,
        pageContext: contextInfo,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
    // Wait for network to settle — session establishment + redirect.
    await page.waitForLoadState('networkidle');

    // Assert we left /login — 30s timeout for cold starts.
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
  });
}

