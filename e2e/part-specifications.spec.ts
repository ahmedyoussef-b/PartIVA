import { test, expect } from '@playwright/test';
import { users } from './fixtures/users';

async function getFirstPartId(playwright: any): Promise<string> {
  const ctx = await playwright.request.newContext();
  try {
    const user = users.ADMIN;
    const response = await ctx.post('/api/auth/sign-in/email', {
      data: { email: user.email, password: user.password },
    });
    expect(response.status()).toBe(200);
    const partsResponse = await ctx.get('/api/parts');
    expect(partsResponse.status()).toBe(200);
    const parts = await partsResponse.json();
    expect(Array.isArray(parts)).toBe(true);
    expect(parts.length).toBeGreaterThan(0);
    return parts[0].id as string;
  } finally {
    await ctx.dispose();
  }
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

test('api: GET /api/parts/[id]/specifications without auth returns 401', async ({
  request,
  playwright,
}) => {
  const partId = '00000000-0000-0000-0000-000000000000';
  const response = await request.get(`/api/parts/${partId}/specifications`);
  expect(response.status()).toBe(401);
});

test('api: GET /api/parts/[id]/specifications with auth returns 200 and JSON array', async ({
  request,
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(`/api/parts/${partId}/specifications`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('api: POST /api/parts/[id]/specifications creates a specification', async ({
  request,
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
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

test('api: POST /api/parts/[id]/specifications duplicate key returns 409', async ({
  request,
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
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

test('api: PATCH /api/parts/[id]/specifications/[specId] updates value', async ({
  request,
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
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

test('api: DELETE /api/parts/[id]/specifications/[specId] returns 204', async ({
  request,
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
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
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.post(`/api/parts/${partId}/specifications`, {
    headers,
    data: { value: 'missing key' },
  });
  expect(response.status()).toBe(400);
});

test('api: GET /api/parts/[id]/specifications/[specId] unknown spec returns 404 on PATCH', async ({
  request,
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.patch(
    `/api/parts/${partId}/specifications/00000000-0000-0000-0000-000000000000`,
    { headers, data: { value: 'x' } },
  );
  expect(response.status()).toBe(404);
});

test('api: GET /api/parts/[id]/specifications/suggestions without auth returns 401', async ({
  request,
}) => {
  const partId = '00000000-0000-0000-0000-000000000000';
  const response = await request.get(`/api/parts/${partId}/specifications/suggestions`);
  expect(response.status()).toBe(401);
});

test('api: GET /api/parts/[id]/specifications/suggestions with auth returns 200 and missing keys', async ({
  request,
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
  const { headers } = await authRequest(request, 'ADMIN');

  const specsResponse = await request.get(`/api/parts/${partId}/specifications`, {
    headers,
  });
  expect(specsResponse.status()).toBe(200);
  const specs = await specsResponse.json();
  const presentKeys = new Set(specs.map((s: { key: string }) => s.key));

  const response = await request.get(`/api/parts/${partId}/specifications/suggestions`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.partId).toBe(partId);
  expect(Array.isArray(body.suggestions)).toBe(true);

  for (const suggestion of body.suggestions) {
    expect(typeof suggestion.key).toBe('string');
    expect(typeof suggestion.unit).toBe('string');
    expect(presentKeys.has(suggestion.key)).toBe(false);
  }
});

test('api: GET /api/parts/[id]/specifications/suggestions returns empty when all required keys present', async ({
  request,
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
  const { headers } = await authRequest(request, 'ADMIN');

  const requiredKeys = [
    'diameter_ext',
    'diameter_int',
    'width',
    'weight',
    'module',
    'teeth',
    'bore',
    'contact_angle',
  ];

  const createdIds: string[] = [];
  try {
    for (const key of requiredKeys) {
      const res = await request.post(`/api/parts/${partId}/specifications`, {
        headers,
        data: { key, value: '1' },
      });
      if (res.status() === 201) {
        const created = await res.json();
        createdIds.push(created.id);
      }
    }

    const response = await request.get(`/api/parts/${partId}/specifications/suggestions`, {
      headers,
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.suggestions).toEqual([]);
  } finally {
    for (const id of createdIds) {
      await request.delete(`/api/parts/${partId}/specifications/${id}`, {
        headers,
      });
    }
  }
});
