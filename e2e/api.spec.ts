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

test('api: /api/search POST with empty body returns 200 and JSON array', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.post('/api/search', { headers, data: {} });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('api: /api/parts GET without auth returns 401', async ({ request }) => {
  const response = await request.get('/api/parts');
  expect(response.status()).toBe(401);
});

test('api: /api/parts GET with ADMIN returns all parts', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/parts', { headers });
  expect(response.status()).toBe(200);
  const parts = await response.json();
  expect(Array.isArray(parts)).toBe(true);
  expect(parts.length).toBeGreaterThan(0);
});

test('api: /api/parts GET with USER returns only own parts', async ({ request }) => {
  const { headers } = await authRequest(request, 'USER');
  const response = await request.get('/api/parts', { headers });
  expect(response.status()).toBe(200);
  const parts = await response.json();
  expect(Array.isArray(parts)).toBe(true);

  const sessionResponse = await request.get('/api/auth/get-session', {
    headers,
  });
  const session = await sessionResponse.json();
  const userId = session?.user?.id;

  expect(parts.length).toBeGreaterThan(0);
  for (const part of parts) {
    expect(part.clientId).toBe(userId);
  }
});

test('api: /api/parts GET with VIEWER returns all parts', async ({ request }) => {
  const { headers } = await authRequest(request, 'VIEWER');
  const response = await request.get('/api/parts', { headers });
  expect(response.status()).toBe(200);
  const parts = await response.json();
  expect(Array.isArray(parts)).toBe(true);
  expect(parts.length).toBeGreaterThan(0);
});

test('api: /api/parts/[id] GET without auth returns 401', async ({ request }) => {
  const partId = '00000000-0000-0000-0000-000000000000';
  const response = await request.get(`/api/parts/${partId}`);
  expect(response.status()).toBe(401);
});

test('api: /api/parts POST without auth returns 401', async ({ request }) => {
  const response = await request.post('/api/parts', {
    data: { partNumber: 'E2E-NOAUTH-001', name: 'Pièce sans auth' },
  });
  expect(response.status()).toBe(401);
});

test('api: /api/parts POST with valid minimal payload returns 201', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const partNumber = `E2E-${Date.now()}`;
  const response = await request.post('/api/parts', {
    headers,
    data: { partNumber, name: 'Pièce E2E minimale' },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.partNumber).toBe(partNumber);
  expect(body.name).toBe('Pièce E2E minimale');
  expect(body.status).toBe('DRAFT');
  expect(typeof body.id).toBe('string');
  expect(typeof body.ptvReference).toBe('string');
});

test('api: /api/parts POST with full payload returns 201', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const listResponse = await request.get('/api/parts', { headers });
  expect(listResponse.status()).toBe(200);
  const parts = await listResponse.json();
  const categoryId = parts[0]?.categoryId;

  const partNumber = `E2E-FULL-${Date.now()}`;
  const response = await request.post('/api/parts', {
    headers,
    data: {
      partNumber,
      name: 'Pièce E2E complète',
      description: 'Description de test E2E',
      status: 'draft',
      ...(categoryId ? { categoryId } : {}),
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.partNumber).toBe(partNumber);
  expect(body.name).toBe('Pièce E2E complète');
  expect(body.description).toBe('Description de test E2E');
  expect(body.status).toBe('DRAFT');
  if (categoryId) {
    expect(body.category?.id).toBe(categoryId);
  }
});

test('api: /api/parts POST with invalid payload returns 400', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.post('/api/parts', {
    headers,
    data: { description: 'Missing partNumber and name' },
  });
  expect(response.status()).toBe(400);
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

// E0-S07b-3-D (D48) — POST /api/sync stub contract.
// D55: no Origin header (non-BetterAuth route).
// D56: timestamp asserted as parseable string, not strict ISO round-trip.
test('api: /api/sync POST returns simulated sync payload', async ({ request }) => {
  const response = await request.post('/api/sync', {
    headers: { 'Content-Type': 'application/json' },
    data: {},
  });

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.status).toBe('success');
  expect(body.received).toBe(2);
  expect(body.ids).toEqual([1041, 1042]);
  expect(typeof body.timestamp).toBe('string');
  expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
});
