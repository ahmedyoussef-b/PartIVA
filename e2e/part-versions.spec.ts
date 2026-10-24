import { test, expect } from '@playwright/test';
import { users } from './fixtures/users';
import { ensureSubmittedPart } from './fixtures/submitted-part';

async function listPartsAsAdmin(
  playwright: any,
): Promise<Array<{ id: string; partNumber: string; status: string; clientId?: string | null }>> {
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
  const ctx = await playwright.request.newContext();
  try {
    const user = users.ADMIN;
    const login = await ctx.post('/api/auth/sign-in/email', {
      data: { email: user.email, password: user.password },
    });
    expect(login.status()).toBe(200);
    const partsResponse = await ctx.get('/api/parts');
    expect(partsResponse.status()).toBe(200);
    const parts = (await partsResponse.json()) as Array<{
      id: string;
      partNumber: string;
      status: string;
      clientId?: string | null;
    }>;
    expect(Array.isArray(parts)).toBe(true);
    expect(parts.length).toBeGreaterThan(0);

    // Privilégier une part non-E2E qui possède déjà des versions : le test
    // "versions non vides" échouerait sur une part du seed sans versions
    // (ex. TD-001, TD-STEP-001). L'hypothèse de données est ainsi vérifiée.
    for (const part of parts) {
      if (part.partNumber.startsWith('E2E-')) continue;
      const versionsResponse = await ctx.get(`/api/parts/${part.id}/versions`);
      expect(versionsResponse.status()).toBe(200);
      const versionsBody = await versionsResponse.json();
      if ((versionsBody.total ?? 0) > 0) {
        return part.id as string;
      }
    }

    // Fallback : première part non-E2E (comportement historique).
    const seeded = parts.find((p) => !p.partNumber.startsWith('E2E-'));
    return (seeded ?? parts[0])?.id as string;
  } finally {
    await ctx.dispose();
  }
}

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
      await new Promise((resolve) => setTimeout(resolve, delay));
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

test('api: GET /api/parts/[id]/versions without auth returns 401', async ({ request }) => {
  const partId = '00000000-0000-0000-0000-000000000000';
  const response = await request.get(`/api/parts/${partId}/versions`);
  expect(response.status()).toBe(401);
});

test('api: GET /api/parts/[id]/versions with auth returns 200 and non-empty list', async ({
  request,
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
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

test('api: GET /api/parts/[id]/versions respects pageSize pagination', async ({
  request,
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(`/api/parts/${partId}/versions?page=1&pageSize=1`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.pageSize).toBe(1);
  expect(body.versions.length).toBeLessThanOrEqual(1);
});

test.describe('Versions consommant SUBMITTED', () => {
  // D-e2e-submitted-consumption (E2-S10) : recréation ciblée d'une part
  // SUBMITTED avant le test — le skip silencieux masquait la consommation
  // du stock du seed (transition SUBMITTED->IDENTIFYING irréversible).
  test.beforeEach(async ({ request }) => {
    await ensureSubmittedPart();
  });

  test('api: ADMIN transition SUBMITTED->IDENTIFYING creates a new version', async ({
    request,
  }) => {
    const { headers: listHeaders } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/parts', { headers: listHeaders });
    expect(response.status()).toBe(200);
    const parts = await response.json();
    const part = parts.find((p: { status: string }) => p.status === 'SUBMITTED');
    expect(part).toBeTruthy();

    const beforeResponse = await request.get(`/api/parts/${part.id}/versions`, {
      headers: listHeaders,
    });
    expect(beforeResponse.status()).toBe(200);
    const before = await beforeResponse.json();
    const beforeCount = before.total as number;

    const transitionResponse = await request.post(`/api/parts/${part.id}/transition`, {
      headers: listHeaders,
      data: { toStatus: 'IDENTIFYING', reason: 'E2E version creation test' },
    });
    expect(transitionResponse.status()).toBe(200);

    const afterResponse = await request.get(`/api/parts/${part.id}/versions`, {
      headers: listHeaders,
    });
    expect(afterResponse.status()).toBe(200);
    const after = await afterResponse.json();
    expect(after.total).toBe(beforeCount + 1);

    const latest = after.versions[0];
    expect(latest.versionNumber).toBeGreaterThan(1);
    expect(latest.snapshot.status).toBe('IDENTIFYING');
  });
});

test('api: GET /api/parts/[id]/versions USER on another client part returns 403', async ({
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

  const response = await request.get(`/api/parts/${otherPart.id}/versions`, {
    headers,
  });
  expect(response.status()).toBe(403);
});
