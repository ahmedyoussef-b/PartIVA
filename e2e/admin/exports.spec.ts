/**
 * V1.5-B — D-V14-BUILDS-EMPTY : test download binaire (route publique)
 * Fixture : public/builds/test.bin (10 bytes)
 */
import { test, expect } from '@playwright/test';

test.describe('Admin — Exports (V1.5-B)', () => {
  test('E1. GET /api/desktop-builds/download?file=test.bin retourne un fichier binaire', async ({ request }) => {
    const response = await request.get('/api/desktop-builds/download?file=test.bin');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-disposition']).toMatch(/attachment/);
    expect(response.headers()['content-type']).toMatch(/application\/octet-stream/);
    const body = await response.body();
    expect(body.length).toBe(10);
  });

  test('E2. GET /api/desktop-builds/download?file=absent.bin retourne 404', async ({ request }) => {
    const response = await request.get('/api/desktop-builds/download?file=absent.bin');
    expect(response.status()).toBe(404);
  });
});
