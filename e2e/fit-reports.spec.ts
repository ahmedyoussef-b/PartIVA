import { test, expect } from '@playwright/test';
import { users } from './fixtures/users';

async function authRequest(
  request: import('@playwright/test').APIRequestContext,
  role: 'ADMIN' | 'USER' | 'VIEWER',
) {
  const user = users[role];
  const response = await request.post('/api/auth/sign-in/email', {
    data: { email: user.email, password: user.password },
  });
  expect(response.status()).toBe(200);
  return { headers: {} };
}

test.describe('E14-R2 — FitReport API', () => {
  test('GET /api/fit-reports?partId=... → 200 (VIEWER)', async ({ request }) => {
    const { headers } = await authRequest(request, 'VIEWER');
    const response = await request.get('/api/fit-reports?partId=TD-001', { headers });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('POST /api/fit-reports → 201 (USER)', async ({ request }) => {
    const { headers } = await authRequest(request, 'USER');
    const response = await request.post('/api/fit-reports', {
      headers,
      data: { partId: 'TD-001', rating: 4, comment: 'Pièce bien adaptée' },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.rating).toBe(4);
    expect(body.comment).toBe('Pièce bien adaptée');
  });

  test('GET /api/fit-reports sans auth → 401', async ({ request }) => {
    const response = await request.get('/api/fit-reports?partId=TD-001');
    expect(response.status()).toBe(401);
  });
});