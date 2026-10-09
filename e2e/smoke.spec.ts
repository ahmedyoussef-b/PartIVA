import { test, expect } from '@playwright/test';

test('smoke: /api/search returns 4 candidates sorted by score desc', async ({ request }) => {
  const response = await request.post('/api/search', {
    data: {},
  });
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBe(4);

  // Vérifier tri décroissant sur scores.global
  for (let i = 0; i < body.length - 1; i++) {
    expect(body[i].scores.global).toBeGreaterThanOrEqual(body[i + 1].scores.global);
  }

  // Vérifier le premier candidat = local_db PL-004812
  expect(body[0].source).toBe('local_db');
  expect(body[0].reference).toBe('PL-004812');
});

test('smoke: /api/search with source filter returns 1 traceparts candidate', async ({
  request,
}) => {
  const response = await request.post('/api/search', {
    data: { source: 'traceparts' },
  });
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.length).toBe(1);
  expect(body[0].source).toBe('traceparts');
  expect(body[0].reference).toBe('TP-948210-EN');
});

test('smoke: /admin/* redirects to /login when unauthenticated', async ({ request }) => {
  const response = await request.get('/admin/demandes/anything/recherche', {
    maxRedirects: 0,
  });
  expect([301, 302, 307, 308]).toContain(response.status());
});
