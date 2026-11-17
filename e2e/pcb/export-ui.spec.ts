import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';

/**
 * V8-D-13-b — Boutons d'export (BOM XLSX / Gerber ZIP) dans la page projet PCB.
 * On seed un projet réel avec 2 composants (cascade supprimée en afterAll),
 * puis on mocke les routes d'export pour tester le déclenchement client-side.
 */

test.describe('PCB Export UI', () => {
  let projectId: string;

  test.beforeAll(async () => {
    const project = await prisma.pcbProject.create({
      data: { name: 'Projet test E2E V8-D-13-b', status: 'draft' },
    });
    projectId = project.id;

    await prisma.pcbComponent.createMany({
      data: [
        { projectId, reference: 'R1', name: 'Resistor 10k', catalogId: 'RC0805FR-0710KL' },
        { projectId, reference: 'R2', name: 'Resistor 10k', catalogId: 'RC0805FR-0710KL' },
      ],
    });
  });

  test.afterAll(async () => {
    await prisma.pcbProject.deleteMany({
      where: { id: projectId },
    });
  });

  test('should trigger BOM download on click', async ({ page }) => {
    await page.route('**/api/pcb/export/bom', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: Buffer.from('FAKE_XLSX_CONTENT'),
      }),
    );

    await page.goto(`/admin/pcb/${projectId}`);

    await expect(page.getByText('Exports Fabrication')).toBeVisible({ timeout: 20000 });

    const bomBtn = page.getByRole('button', { name: /BOM \(XLSX\)/i });
    await expect(bomBtn).toBeVisible();
    await expect(bomBtn).toBeEnabled();

    const downloadPromise = page.waitForEvent('download');
    await bomBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^BOM-.*\.xlsx$/);
  });

  test('should disable buttons during export', async ({ page }) => {
    await page.route('**/api/pcb/export/bom', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: Buffer.from('FAKE_XLSX_CONTENT'),
      });
    });

    await page.goto(`/admin/pcb/${projectId}`);

    const bomBtn = page.getByRole('button', { name: /BOM \(XLSX\)/i });
    const gerberBtn = page.getByRole('button', { name: /Gerber \(ZIP\)/i });
    await expect(bomBtn).toBeVisible({ timeout: 20000 });
    await expect(bomBtn).toBeEnabled();

    await bomBtn.click();

    // Pendant l'export, le bouton BOM bascule en "⏳ Export..." (nom inaccessible
    // via /BOM/) : on vérifie donc le bouton Gerber (nom stable) qui doit être
    // désactivé, ainsi que l'indicateur de chargement.
    await expect(gerberBtn).toBeDisabled();
    await expect(page.locator('button', { hasText: 'Export...' }).first()).toBeDisabled();
  });
});
