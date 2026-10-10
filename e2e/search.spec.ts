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

test('api: GET /api/search without auth returns 401', async ({ request }) => {
  const response = await request.get('/api/search?q=roulement');
  expect(response.status()).toBe(401);
});

test('api: GET /api/search with q too short returns 400', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?q=x', { headers });
  expect(response.status()).toBe(400);
});

test('api: GET /api/search with valid q returns 200 and non-empty results', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?q=roulement', {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.query).toBe('roulement');
  expect(Array.isArray(body.results)).toBe(true);
  expect(body.count).toBeGreaterThan(0);
  expect(body.results[0].ptvReference).toBeTruthy();
  expect(body.results[0].name).toBeTruthy();
  expect(typeof body.results[0].rank).toBe('number');
});

test('api: GET /api/search with unknown q returns 200 and empty results', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(`/api/search?q=zzzz${Date.now()}`, { headers });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBe(0);
  expect(body.results).toEqual([]);
});

test('api: GET /api/search by USER returns only own parts', async ({ request }) => {
  const { headers } = await authRequest(request, 'USER');
  const response = await request.get('/api/search?q=roulement', {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body.results)).toBe(true);
  for (const result of body.results) {
    expect(result).toHaveProperty('id');
  }
});

test('api: GET /api/search by ADMIN returns all matching parts', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?q=roulement', {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBeGreaterThan(0);
});
