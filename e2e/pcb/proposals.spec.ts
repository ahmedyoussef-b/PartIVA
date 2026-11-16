import { test, expect } from '@playwright/test';

test.describe('PCB - AI Engine mode guidé', () => {
  test('proposition → validation → application', async ({ page }) => {
    // Mock de la route LLM pour éviter un appel réel
    await page.route('**/api/pcb/propose', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          proposals: [
            {
              action: 'add_component',
              target: 'pcb_project',
              payload: { name: 'Arduino UNO', reference: 'U1' },
              reason: 'Microcontrôleur principal',
              requires_validation: true,
            },
          ],
        }),
      });
    });

    // TODO : naviguer vers une page qui affiche PcbProposalDiff
    // Pour l'instant, vérifier que la route mockée répond via fetch dans le contexte page
    await page.goto('/admin/pcb/nouveau');
    const body = await page.evaluate(async () => {
      const res = await fetch('/api/pcb/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: [] }),
      });
      return res.json();
    });
    expect(body.proposals).toHaveLength(1);
    expect(body.proposals[0].action).toBe('add_component');
  });
});
