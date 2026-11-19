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

  test('should render geometric overlay canvas with 4-color layers', async ({ page }) => {
    await page.goto(`/admin/pcb/${projectId}`);

    // Conteneur du rendu géométrique (data-testid posé par P6.3-c-1).
    const canvas = page.getByTestId('visual-comparison-canvas');
    await expect(canvas).toBeVisible();

    // Présence d'éléments géométriques SVG (plaques extrudées), pas un placeholder.
    const polygons = canvas.locator('polygon');
    await expect(polygons.first()).toBeVisible();

    // Activer les 3 modes restants → 4 couches actives.
    await page.getByRole('button', { name: /Après Revue/i }).click();
    await page.getByRole('button', { name: /Après Sourcing/i }).click();
    await page.getByRole('button', { name: /Prêt Export/i }).click();
    await expect(page.getByText(/4 couche\(s\) active\(s\)/i)).toBeVisible();

    // Les 4 couleurs de MODE_CONFIG doivent apparaître dans le rendu SVG.
    const canvasHtml = await canvas.innerHTML();
    expect(canvasHtml).toMatch(/#3B82F6/i);
    expect(canvasHtml).toMatch(/#10B981/i);
    expect(canvasHtml).toMatch(/#F59E0B/i);
    expect(canvasHtml).toMatch(/#8B5CF6/i);
  });
});
