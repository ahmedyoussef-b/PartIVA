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

test('api: GET /api/parts/[id]/versions without auth returns 401', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const response = await request.get(`/api/parts/${partId}/versions`);
  expect(response.status()).toBe(401);
});

test('api: GET /api/parts/[id]/versions with auth returns 200 and non-empty list', async ({
  request,
}) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(`/api/parts/${partId}/versions`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body.versions)).toBe(true);
  expect(body.versions.length).toBeGreaterThan(0);
  expect(body.total).toBeGreaterThan(0);
  expect(body.versions[0].versionNumber).toBeGreaterThanOrEqual(1);
  expect(body.versions[0].snapshot).toBeTruthy();
});

test('api: GET /api/parts/[id]/versions respects pageSize pagination', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(`/api/parts/${partId}/versions?page=1&pageSize=1`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.pageSize).toBe(1);
  expect(body.versions.length).toBeLessThanOrEqual(1);
});

test('api: ADMIN transition SUBMITTED->IDENTIFYING creates a new version', async ({ request }) => {
  const response = await request.get('/api/parts');
  expect(response.status()).toBe(200);
  const parts = await response.json();
  const part = parts.find((p: { status: string }) => p.status === 'SUBMITTED');
  if (!part) {
    test.skip();
    return;
  }

  const { headers } = await authRequest(request, 'ADMIN');

  const beforeResponse = await request.get(`/api/parts/${part.id}/versions`, {
    headers,
  });
  expect(beforeResponse.status()).toBe(200);
  const before = await beforeResponse.json();
  const beforeCount = before.total as number;

  const transitionResponse = await request.post(`/api/parts/${part.id}/transition`, {
    headers,
    data: { toStatus: 'IDENTIFYING', reason: 'E2E version creation test' },
  });
  expect(transitionResponse.status()).toBe(200);

  const afterResponse = await request.get(`/api/parts/${part.id}/versions`, {
    headers,
  });
  expect(afterResponse.status()).toBe(200);
  const after = await afterResponse.json();
  expect(after.total).toBe(beforeCount + 1);

  const latest = after.versions[0];
  expect(latest.versionNumber).toBeGreaterThan(1);
  expect(latest.snapshot.status).toBe('IDENTIFYING');
});

test('api: GET /api/parts/[id]/versions USER on another client part returns 403', async ({
  request,
}) => {
  const partsResponse = await request.get('/api/parts');
  expect(partsResponse.status()).toBe(200);
  const parts = await partsResponse.json();

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

  const response = await request.get(`/api/parts/${otherPart.id}/versions`, {
    headers,
  });
  expect(response.status()).toBe(403);
});
