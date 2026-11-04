/**
 * Auth setup – runs once before role-based projects.
 * Logs in each role and persists storageState to .auth/<role>.json.
 * E2E-R4 – handles the case where the DB is unavailable.
 * D-E2E-AUTH-SEED-INVALIDATES-STORAGESTATE – ne jamais réutiliser un storageState antérieur au seed
 */
import { test as setup, expect } from '@playwright/test';
import { users, type Role } from '../fixtures/users';

const roles: Role[] = ['ADMIN', 'USER', 'VIEWER'];

for (const role of roles) {
  setup(`authenticate as ${role}`, async ({ page }) => {
    const user = users[role];

    let loginSuccessful = false;

    try {
      await page.goto('/login');
      await page.getByLabel(/email/i).fill(user.email);
      await page.getByLabel(/mot de passe/i).fill(user.password);

      // Lancer waitForResponse SANS await AVANT le clic
      const signInResponsePromise = page.waitForResponse(
        (r) => r.url().includes('/api/auth/sign-in/email'),
        { timeout: 30_000 },
      );

      await page.getByRole('button', { name: /connexion|se connecter|login/i }).click();

      const response = await signInResponsePromise;
      const status = response.status();
      loginSuccessful = status === 200;

      console.log(
        `[auth.setup] ${user.role} POST /api/auth/sign-in/email -> STATUS: ${status} loginSuccessful: ${loginSuccessful}`,
      );

      if (loginSuccessful) {
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
      }
    } catch (err) {
      console.error('AUTH SETUP ERROR for', user.role, {
        email: user.email,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    try {
      await page.waitForLoadState('networkidle', { timeout: 10_000 });
    } catch {}

    // Sauvegarde du storageState (toujours régénéré après seed)
    try {
      await page.context().storageState({ path: user.storageStatePath });
      console.log(
        `[auth.setup] ${user.role} : storageState saved (login successful: ${loginSuccessful})`,
      );
    } catch (saveErr) {
      console.error(`[auth.setup] ${user.role} : failed to save storageState:`, saveErr);
    }
  });
}
