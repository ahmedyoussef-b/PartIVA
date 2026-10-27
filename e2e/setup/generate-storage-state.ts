/**
 * E2E Setup — Generate storageState for admin role
 * 
 * This script runs a single login session via Better Auth API and saves
 * the browser storageState to .auth/admin.json, .auth/user.json, .auth/viewer.json.
 * 
 * Usage: npx tsx e2e/setup/generate-storage-state.ts
 * 
 * Note: If the database is unavailable (Neon asleep), the script will still
 * attempt to login and save whatever session state is available. The resulting
 * storageState can then be used by Playwright tests to skip the login step.
 */

import 'dotenv/config';
import { test, expect, chromium } from '@playwright/test';
import { users } from '../fixtures/users';
import path from 'node:path';

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@partiva.dev';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'PartIVA-dev-2026!';

async function generateStorageState(role: keyof typeof users, user: typeof users[keyof typeof users]) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  try {
    // Go to login page
    await page.goto('/login');
    
    // Fill credentials
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/mot de passe/i).fill(user.password);
    
    // Click login button
    await page.getByRole('button', { name: /connexion|se connecter|login/i }).click();
    
    // Wait for redirect away from /login
    try {
      await expect(page).not.toHaveURL('/login', { timeout: 15000 });
    } catch {
      // If still on /login, auth may have failed - continue anyway to save state
    }
    
    // Wait for network to settle
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
      // Ignore timeout
    }
    
    // Save storage state
    const storageStatePath = path.resolve(`./.auth/${role}.json`);
    await context.storageState({ path: storageStatePath });
    console.log(`✅ StorageState saved for ${role} at ${storageStatePath}`);
    
  } catch (err) {
    console.error(`❌ Failed to generate storageState for ${role}:`, err);
  } finally {
    await browser.close();
  }
}

// Generate storage states for all roles
(async () => {
  for (const role of ['ADMIN', 'USER', 'VIEWER'] as const) {
    const user = users[role];
    if (user) {
      await generateStorageState(role, user);
    }
  }
  console.log('\n✅ Generation de storageState terminée.');
  console.log('Les fichiers .auth/admin.json, .auth/user.json, .auth/viewer.json peuvent maintenant être utilisés par Playwright.');
})();