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

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/mot de passe/i).fill(user.password);
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click();

    // Wait for network to settle — session establishment + redirect.
    await page.waitForLoadState('networkidle');

    // Assert we left /login — 30s timeout for cold starts.
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });

    await page.context().storageState({ path: user.storageStatePath });
  });
}
