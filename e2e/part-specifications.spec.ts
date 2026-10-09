import { test, expect } from '@playwright/test';
import { users } from './fixtures/users';

async function getFirstPartId(
  request: import('@playwright/test').APIRequestContext,
): Promise<string> {
  const response = await request.get('/api/parts');
  expect(response.status()).toBe(200);
  const parts = await response.json();
  expect(Array.isArray(parts)).toBe(true);
  expect(parts.length).toBeGreaterThan(0);
  return parts[0].id as string;
}

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

test('api: GET /api/parts/[id]/specifications without auth returns 401', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const response = await request.get(`/api/parts/${partId}/specifications`);
  expect(response.status()).toBe(401);
});

test('api: GET /api/parts/[id]/specifications with auth returns 200 and JSON array', async ({
  request,
}) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(`/api/parts/${partId}/specifications`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('api: POST /api/parts/[id]/specifications creates a specification', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');

  const key = `e2e-spec-${Date.now()}`;
  const response = await request.post(`/api/parts/${partId}/specifications`, {
    headers,
    data: {
      key,
      value: '12.5',
      unit: 'mm',
      toleranceMin: 12.0,
      toleranceMax: 13.0,
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.key).toBe(key);
  expect(body.value).toBe('12.5');
  expect(body.unit).toBe('mm');
  expect(body.toleranceMin).toBe(12.0);
  expect(body.toleranceMax).toBe(13.0);
  expect(body.partId).toBe(partId);
});

test('api: POST /api/parts/[id]/specifications duplicate key returns 409', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');

  const key = `e2e-dup-${Date.now()}`;
  const first = await request.post(`/api/parts/${partId}/specifications`, {
    headers,
    data: { key, value: '1.0' },
  });
  expect(first.status()).toBe(201);

  const second = await request.post(`/api/parts/${partId}/specifications`, {
    headers,
    data: { key, value: '2.0' },
  });
  expect(second.status()).toBe(409);
});

test('api: PATCH /api/parts/[id]/specifications/[specId] updates value', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');

  const key = `e2e-patch-${Date.now()}`;
  const created = await request.post(`/api/parts/${partId}/specifications`, {
    headers,
    data: { key, value: 'avant' },
  });
  expect(created.status()).toBe(201);
  const spec = await created.json();

  const patched = await request.patch(`/api/parts/${partId}/specifications/${spec.id}`, {
    headers,
    data: { value: 'après' },
  });
  expect(patched.status()).toBe(200);
  const body = await patched.json();
  expect(body.value).toBe('après');
  expect(body.key).toBe(key);
});

test('api: DELETE /api/parts/[id]/specifications/[specId] returns 204', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');

  const key = `e2e-del-${Date.now()}`;
  const created = await request.post(`/api/parts/${partId}/specifications`, {
    headers,
    data: { key, value: 'à supprimer' },
  });
  expect(created.status()).toBe(201);
  const spec = await created.json();

  const deleted = await request.delete(`/api/parts/${partId}/specifications/${spec.id}`, {
    headers,
  });
  expect(deleted.status()).toBe(204);

  const list = await request.get(`/api/parts/${partId}/specifications`, {
    headers,
  });
  expect(list.status()).toBe(200);
  const body = await list.json();
  expect(body.find((s: { id: string }) => s.id === spec.id)).toBeUndefined();
});

test('api: POST /api/parts/[id]/specifications with invalid payload returns 400', async ({
  request,
}) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.post(`/api/parts/${partId}/specifications`, {
    headers,
    data: { value: 'missing key' },
  });
  expect(response.status()).toBe(400);
});

test('api: GET /api/parts/[id]/specifications/[specId] unknown spec returns 404 on PATCH', async ({
  request,
}) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.patch(
    `/api/parts/${partId}/specifications/00000000-0000-0000-0000-000000000000`,
    { headers, data: { value: 'x' } },
  );
  expect(response.status()).toBe(404);
});
