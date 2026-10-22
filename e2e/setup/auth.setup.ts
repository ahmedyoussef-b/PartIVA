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

      // E27 — capture de la réponse brute Better Auth (status + body) AVANT le clic :
      // sans cela, un échec n'affiche que « timeout sur /login » et masque la cause
      // réelle (401 utilisateur inexistant, 429 rate limit, 403 origine…).
      const signInResponse = page
        .waitForResponse((r) => r.url().includes('/api/auth/sign-in/email'), {
          timeout: 15_000,
        })
        .then(async (r) => {
          const status = r.status();
          let body = '<body unavailable>';
          try {
            body = await r.text();
          } catch {
            // Le corps n'est plus lisible quand la page a déjà navigué (login réussi) :
            // le statut suffit, et le corps est disponible précisément en cas d'échec.
          }
          return { status, body };
        })
        .catch(() => null);

      await page.getByRole('button', { name: /connexion|se connecter|login/i }).click();

      const res = await signInResponse;
      console.log(
        `[auth.setup] ${user.role} POST /api/auth/sign-in/email -> STATUS: ${
          res ? res.status : 'NO_RESPONSE'
        } BODY: ${res ? res.body : '<none>'}`,
      );

      await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
      await page.context().storageState({ path: user.storageStatePath });
    } catch (err) {
      // Log extra context before failing.
      // page.evaluate peut lui-même rejeter (page fermée après un timeout de test) :
      // on l'encadre pour que le journal ci-dessous soit TOUJOURS atteint (E27).
      let contextInfo: { hasLoginFields: boolean; body?: string } | undefined;
      try {
        contextInfo = await page.evaluate(() => {
          const el = document.querySelector('input[type=password]');
          return { hasLoginFields: !!el, body: document.body?.innerHTML?.slice(0, 200) };
        });
      } catch {
        contextInfo = { hasLoginFields: false };
      }
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
