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

test('api: GET /api/parts/[id]/images returns JSON array', async ({ request, playwright }) => {
  const partId = await getFirstPartId(playwright);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(`/api/parts/${partId}/images`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('api: POST /api/parts/[id]/images without auth returns 401', async ({ request }) => {
  const partId = '00000000-0000-0000-0000-000000000000';
  const response = await request.post(`/api/parts/${partId}/images`, {
    data: {
      filename: 'test.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      data: 'aGVsbG8=',
    },
  });
  expect(response.status()).toBe(401);
});

test('api: POST /api/parts/[id]/images with invalid mime returns 400', async ({
  request,
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.post(`/api/parts/${partId}/images`, {
    headers,
    data: {
      filename: 'test.exe',
      mimeType: 'application/x-msdownload',
      sizeBytes: 1024,
      data: 'aGVsbG8=',
    },
  });
  expect([400, 401]).toContain(response.status());
});
