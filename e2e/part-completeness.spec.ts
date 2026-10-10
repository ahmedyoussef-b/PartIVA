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

async function getPartIds(
  request: import('@playwright/test').APIRequestContext,
  headers: Record<string, string>,
) {
  const response = await request.get('/api/parts', { headers });
  expect(response.status()).toBe(200);
  const body = await response.json();
  const parts = Array.isArray(body) ? body : (body.parts ?? body.results ?? []);
  expect(parts.length).toBeGreaterThan(1);
  return parts.map((p: { id: string }) => p.id) as string[];
}

const REQUIRED_KEYS = [
  'diameter_ext',
  'diameter_int',
  'width',
  'weight',
  'module',
  'teeth',
  'bore',
  'contact_angle',
];

test('api: GET /api/parts/[id]/completeness without auth returns 401', async ({ request }) => {
  const response = await request.get('/api/parts/000000000000000000000000/completeness');
  expect(response.status()).toBe(401);
});

test('api: GET /api/parts/[id]/completeness returns 200 with score and missing list', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const [partId] = await getPartIds(request, headers);
  const response = await request.get(`/api/parts/${partId}/completeness`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.partId).toBe(partId);
  expect(typeof body.score).toBe('number');
  expect(body.score).toBeGreaterThanOrEqual(0);
  expect(body.score).toBeLessThanOrEqual(1);
  expect(typeof body.total).toBe('number');
  expect(body.total).toBe(8);
  expect(typeof body.present).toBe('number');
  expect(Array.isArray(body.missing)).toBe(true);
  expect(body.present + body.missing.length).toBe(body.total);
});

test('api: GET /api/parts/[id]/completeness on complete part returns score 1', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const [partId] = await getPartIds(request, headers);

  const createdKeys: string[] = [];
  for (const key of REQUIRED_KEYS) {
    const res = await request.post(`/api/parts/${partId}/specifications`, {
      headers,
      data: { key, value: '1' },
    });
    if (res.status() === 201) {
      createdKeys.push(key);
    }
  }

  const response = await request.get(`/api/parts/${partId}/completeness`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.score).toBe(1);
  expect(body.present).toBe(8);
  expect(body.missing).toEqual([]);

  for (const key of createdKeys) {
    const specs = await request.get(`/api/parts/${partId}/specifications`, {
      headers,
    });
    const list = await specs.json();
    const target = list.find((s: { key: string }) => s.key === key);
    if (target) {
      await request.delete(`/api/parts/${partId}/specifications/${target.id}`, { headers });
    }
  }
});

test('api: GET /api/parts/[id]/completeness on incomplete part lists missing keys', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const partIds = await getPartIds(request, headers);
  const partId = partIds[partIds.length - 1];
  const response = await request.get(`/api/parts/${partId}/completeness`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.score).toBeLessThan(1);
  expect(body.missing.length).toBeGreaterThan(0);
  for (const key of body.missing) {
    expect(REQUIRED_KEYS).toContain(key);
  }
});

test('api: GET /api/parts/[id]/completeness on unknown part returns 404', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/parts/000000000000000000000000/completeness', {
    headers,
  });
  expect(response.status()).toBe(404);
});
