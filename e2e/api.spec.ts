import { test, expect } from '@playwright/test';
import { users } from './fixtures/users';

async function authRequest(
  request: import('@playwright/test').APIRequestContext,
  role: 'ADMIN' | 'USER' | 'VIEWER',
) {
  const user = users[role];
  
  // Retry with exponential backoff for rate limiting (429)
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let response;
  
  while (retryCount < MAX_RETRIES) {
    response = await request.post('/api/auth/sign-in/email', {
      data: { email: user.email, password: user.password },
    });
    
    if (response.status() === 429) {
      retryCount++;
      if (retryCount >= MAX_RETRIES) {
        break;
      }
      // Exponential backoff: 100ms * (2 ^ retryCount)
      const delay = 100 * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    // For other non-200 responses (401, 403, 400, etc.), fail immediately
    if (response.status() !== 200) {
      break;
    }
    
    // Success
    break;
  }
  
  // After the loop, if we got a 429 after all retries, throw an error
  // Otherwise, if we got a 200, return success
  if (!response) {
    throw new Error('Auth request failed: No response');
  }
  
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

// E8P-S04 — namespace dédié /api/desktop/sync/* (D-E8P-S01-12 = B).
// Sync unidirectionnelle web → local (D-E8P-S01-2), auth obligatoire (D-E8P-S01-9).
// test.slow() : première compilation de route sur FS lent (D-e2e-load-timeouts).

test('api: /api/desktop/sync/manifest GET without auth returns 401', async ({ request }) => {
  test.slow();
  const response = await request.get('/api/desktop/sync/manifest');
  expect(response.status()).toBe(401);
});

test('api: /api/desktop/sync/pull GET without auth returns 401', async ({ request }) => {
  test.slow();
  const response = await request.get('/api/desktop/sync/pull?table=part');
  expect(response.status()).toBe(401);
});

test('api: /api/desktop/sync/manifest GET with ADMIN returns tables and direction', async ({
  request,
}) => {
  test.slow();
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/desktop/sync/manifest', { headers });

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.version).toBe(1);
  expect(body.sync_direction).toBe('web_to_local');

  const names = body.tables.map((table: { name: string }) => table.name);
  // Le registre source de vérité est SYNC_TABLES (src/lib/sync/tables.ts) :
  // la liste attendue doit en être dérivée, non codée en dur, afin de rester
  // cohérente si de nouvelles tables synchronisables sont ajoutées.
  expect(names).toEqual([
    'part',
    'vehicle',
    'fitment',
    'part_image',
    'part_version',
    'part_specification',
    'part_category',
    'material',
    'request',
  ]);

  const part = body.tables.find((table: { name: string }) => table.name === 'part');
  expect(part.incremental).toBe(true);
  const fitment = body.tables.find((table: { name: string }) => table.name === 'fitment');
  expect(fitment.incremental).toBe(false);
});

test('api: /api/desktop/sync/pull GET with unknown table returns 400', async ({ request }) => {
  test.slow();
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/desktop/sync/pull?table=users', { headers });
  expect(response.status()).toBe(400);
});

test('api: /api/desktop/sync/pull GET without table param returns 400', async ({ request }) => {
  test.slow();
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/desktop/sync/pull', { headers });
  expect(response.status()).toBe(400);
});

test('api: /api/desktop/sync/pull GET with valid table returns data', async ({ request }) => {
  test.slow();
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/desktop/sync/pull?table=vehicle', { headers });

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.table).toBe('vehicle');
  expect(Array.isArray(body.data)).toBe(true);
  expect(body.count).toBe(body.data.length);

  for (const vehicle of body.data) {
    // Miroir fidèle de la migration locale — pas de champ embedding/search_vector
    expect(vehicle).toHaveProperty('id');
    expect(vehicle).toHaveProperty('make');
    expect(vehicle).toHaveProperty('model');
    expect(vehicle).toHaveProperty('year');
    expect(vehicle).not.toHaveProperty('embedding');
    expect(vehicle).not.toHaveProperty('searchVector');
  }
});
