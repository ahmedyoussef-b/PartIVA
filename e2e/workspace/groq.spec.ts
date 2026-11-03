import { test, expect } from '@playwright/test';

const baseResult = {
  success: true,
  ingest: {
    inputType: 'photo',
    analysisStatus: 'success',
    warnings: [],
    metadata: { fileCount: 1 },
  },
  search: { searchStatus: 'success', candidates: [] },
  reconstruct: { reconstructStatus: 'failed', candidates: [], warnings: [] },
  archive: { archiveStatus: 'skipped' },
};

test.describe('Workspace — Groq (chat réel, sans 3D)', () => {
  test('V1.2-A: appel Groq réel via /api/ai/chat (assistant)', async ({ page }) => {
    // Mock /api/engine pour activer le chat (désactivé sans résultat)
    await page.route('**/api/engine', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(baseResult),
      });
    });

    await page.addInitScript(() => localStorage.removeItem('partiva-workspace-state'));
    await page.goto('/workspace');
    await page.getByPlaceholder('Description').fill('test part');
    await page.getByRole('button', { name: /Analyser/i }).click();
    await expect(page.getByText(/Ingestion: photo/i)).toBeVisible();

    const chatInput = page.getByPlaceholder('Posez votre question...');
    await expect(chatInput).toBeEnabled();

    // Envoi d'un message → appelle /api/ai/chat (Groq réel, route non mockée)
    await chatInput.fill('test');
    await chatInput.press('Enter');

    // Attendre la réponse HTTP réelle de /api/ai/chat
    const response = await page.waitForResponse('**/api/ai/chat', { timeout: 30000 });
    const body = await response.json();
    expect(response.ok()).toBeTruthy();
    expect(body.source).not.toBe('mock');
    expect(body.reply).toBeTruthy();
    expect(body.reply).not.toContain('indisponible');

    // L'assistant doit afficher une réponse réelle (pas le fallback "indisponible")
    await expect(page.getByText('Groq indisponible')).not.toBeVisible();
  });

// D-CHAT-FALLBACK-NOT-TESTABLE
// Le fallback de /api/ai/chat (Groq indisponible → source: 'mock') ne peut pas être
// testé en E2E sans un point d'injection test-only dans la route (ex: header
// `x-test-no-groq: 1`). Mocker /api/ai/chat pour simuler le fallback ne teste que
// l'affichage d'un mock, pas le comportement du fallback — c'est un faux-semblant.
// À traiter en phase dédiée (test unitaire de GroqProvider.chat avec callGroq mocké
// en erreur, OU ajout d'un point d'injection test-only dans /api/ai/chat).
test.skip('V1.2-B: fallback mock quand Groq indisponible (dette D-CHAT-FALLBACK-NOT-TESTABLE)', async () => {
  // Test skippé — voir commentaire ci-dessus.
});

// D-ENGINE-GROQ-PROOF
// Aucun champ observable dans la réponse de /api/engine ne permet de prouver que Groq a été appelé.
// src/app/api/engine/route.ts:44 retourne { success: true, ...result } où result est un EngineResult
// ({ ingest, search, reconstruct, archive } — engine.ts:12-17) sans aucun indicateur d'utilisation de Groq.
// L'enrichissement par Groq (route.ts:23-41) modifie l'input interne mais n'ajoute aucune trace observable
// dans le payload HTTP. Pour prouver l'appel Groq, il faudrait soit ajouter un champ (ex: groqUsed: true),
// soit tracer la description enrichie, soit comparer les métadonnées avant/après.
// À traiter en phase dédiée (ajout d'un champ observable dans /api/engine OU test unitaire de callGroq).
test.skip('V1.2-C: engine deep mode appelle Groq pour enrichissement extraction (dette D-ENGINE-GROQ-PROOF)', async () => {
  // Test skippé — aucun champ observable ne prouve l'appel Groq dans la réponse de /api/engine.
});
});
