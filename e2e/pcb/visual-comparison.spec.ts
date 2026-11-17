import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';

test.describe('Visual Comparison Overlay', () => {
  let projectId: string;

  test.beforeAll(async () => {
    const project = await prisma.pcbProject.create({
      data: { name: 'Test Visual Comparison' },
    });
    projectId = project.id;
  });

  test.afterAll(async () => {
    await prisma.pcbProject.deleteMany({ where: { id: projectId } });
  });

  test('should display all 4 comparison modes', async ({ page }) => {
    await page.goto(`/admin/pcb/${projectId}`);

    await expect(page.getByRole('button', { name: /Original/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Après Revue/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Après Sourcing/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Prêt Export/i })).toBeVisible();
  });

  test('should toggle modes and update active count', async ({ page }) => {
    await page.goto(`/admin/pcb/${projectId}`);

    await expect(page.getByText(/1 couche\(s\) active\(s\)/i)).toBeVisible();

    await page.getByRole('button', { name: /Après Revue/i }).click();
    await expect(page.getByText(/2 couche\(s\) active\(s\)/i)).toBeVisible();

    await page.getByRole('button', { name: /Original/i }).click();
    await expect(page.getByText(/1 couche\(s\) active\(s\)/i)).toBeVisible();
  });

  test('should adjust opacity slider correctly', async ({ page }) => {
    await page.goto(`/admin/pcb/${projectId}`);

    const slider = page.locator('input[type="range"]');
    await slider.fill('0.5');

    await expect(page.getByText('50%')).toBeVisible();
  });
});
