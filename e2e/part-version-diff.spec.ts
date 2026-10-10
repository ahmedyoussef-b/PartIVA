import { test, expect } from '@playwright/test';
import { users } from './fixtures/users';

async function listPartsAsAdmin(
  playwright: any,
): Promise<Array<{ id: string; status: string; clientId?: string | null }>> {
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
    return parts;
  } finally {
    await ctx.dispose();
  }
}

async function getFirstPartId(playwright: any): Promise<string> {
  const parts = await listPartsAsAdmin(playwright);
  return parts[0]?.id as string;
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
  const partId = '00000000-0000-0000-0000-000000000000';
  const response = await request.get(`/api/parts/${partId}/versions/diff?from=1&to=2`);
  expect(response.status()).toBe(401);
});

test('api: GET /api/parts/[id]/versions/diff with invalid query returns 400', async ({
  request,
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
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
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
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
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
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
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(`/api/parts/${partId}/versions/diff?from=1&to=999999`, {
    headers,
  });
  expect(response.status()).toBe(404);
});

test('api: GET /api/parts/[id]/versions/diff USER on another client part returns 403', async ({
  request,
  playwright,
}) => {
  const parts = await listPartsAsAdmin(playwright);

  const { headers } = await authRequest(request, 'USER');
  const sessionResponse = await request.get('/api/auth/get-session', {
    headers,
  });
  const session = await sessionResponse.json();
  const userId = session?.user?.id;

  const otherPart = parts.find(
    (p: { clientId?: string | null }) => p.clientId && p.clientId !== userId,
  );

  if (!otherPart) {
    test.skip();
    return;
  }

  const response = await request.get(`/api/parts/${otherPart.id}/versions/diff?from=1&to=2`, {
    headers,
  });
  expect(response.status()).toBe(403);
});
