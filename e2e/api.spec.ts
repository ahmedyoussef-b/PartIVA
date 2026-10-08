import { test, expect } from '@playwright/test';

test('api: /api/search POST with empty body returns 200 and JSON array', async ({ request }) => {
  const response = await request.post('/api/search', { data: {} });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('api: /api/parts GET returns JSON', async ({ request }) => {
  const response = await request.get('/api/parts');
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(typeof body).toBe('object');
});

test('api: /api/requests GET returns JSON or 401', async ({ request }) => {
  const response = await request.get('/api/requests');
  expect([200, 401]).toContain(response.status());
  const body = await response.json();
  expect(typeof body).toBe('object');
});

test('api: /api/sync does not allow GET', async ({ request }) => {
  const response = await request.get('/api/sync');
  expect(response.status()).toBe(405);
});
