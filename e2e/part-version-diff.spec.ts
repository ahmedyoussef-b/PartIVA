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

async function getVersionNumbers(
  request: import('@playwright/test').APIRequestContext,
  partId: string,
  headers: Record<string, string>,
): Promise<number[]> {
  const response = await request.get(`/api/parts/${partId}/versions?page=1&pageSize=100`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  return (body.versions ?? []).map((v: { versionNumber: number }) => v.versionNumber);
}

test('api: GET /api/parts/[id]/versions/diff without auth returns 401', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const response = await request.get(`/api/parts/${partId}/versions/diff?from=1&to=2`);
  expect(response.status()).toBe(401);
});

test('api: GET /api/parts/[id]/versions/diff with invalid query returns 400', async ({
  request,
}) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');

  const missing = await request.get(`/api/parts/${partId}/versions/diff`, { headers });
  expect(missing.status()).toBe(400);

  const invalid = await request.get(`/api/parts/${partId}/versions/diff?from=abc&to=2`, {
    headers,
  });
  expect(invalid.status()).toBe(400);

  const zero = await request.get(`/api/parts/${partId}/versions/diff?from=0&to=2`, { headers });
  expect(zero.status()).toBe(400);
});

test('api: GET /api/parts/[id]/versions/diff with two different versions returns 200', async ({
  request,
}) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');

  const numbers = await getVersionNumbers(request, partId, headers);
  if (numbers.length < 2) {
    test.skip();
    return;
  }
  const sorted = [...numbers].sort((a, b) => a - b);
  const from = sorted[0];
  const to = sorted[sorted.length - 1];

  const response = await request.get(`/api/parts/${partId}/versions/diff?from=${from}&to=${to}`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.from).toBe(from);
  expect(body.to).toBe(to);
  expect(Array.isArray(body.diffs)).toBe(true);
});

test('api: GET /api/parts/[id]/versions/diff with identical versions returns empty diffs', async ({
  request,
}) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');

  const numbers = await getVersionNumbers(request, partId, headers);
  if (numbers.length < 1) {
    test.skip();
    return;
  }
  const version = numbers[0];

  const response = await request.get(
    `/api/parts/${partId}/versions/diff?from=${version}&to=${version}`,
    { headers },
  );
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.from).toBe(version);
  expect(body.to).toBe(version);
  expect(body.diffs).toEqual([]);
});

test('api: GET /api/parts/[id]/versions/diff with unknown version returns 404', async ({
  request,
}) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(`/api/parts/${partId}/versions/diff?from=1&to=999999`, {
    headers,
  });
  expect(response.status()).toBe(404);
});
