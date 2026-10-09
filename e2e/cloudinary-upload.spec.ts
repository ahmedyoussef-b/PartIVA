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

// 1x1 pixel PNG (base64), ~70 octets — bien sous la limite 5 Mo
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test('api: POST /api/upload without auth returns 401', async ({ request }) => {
  const response = await request.post('/api/upload', {
    data: {
      folder: 'test',
      data: TINY_PNG_BASE64,
      mimeType: 'image/png',
    },
  });
  expect(response.status()).toBe(401);
});

test('api: POST /api/upload with invalid mime returns 400', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.post('/api/upload', {
    headers,
    data: {
      folder: 'test',
      data: TINY_PNG_BASE64,
      mimeType: 'application/x-msdownload',
    },
  });
  expect(response.status()).toBe(400);
});

test('api: POST /api/upload with invalid payload returns 400', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.post('/api/upload', {
    headers,
    data: { folder: 'test' },
  });
  expect(response.status()).toBe(400);
});

test('api: POST /api/parts/[id]/images without auth returns 401', async ({ request }) => {
  const partsResponse = await request.get('/api/parts');
  expect(partsResponse.status()).toBe(200);
  const parts = await partsResponse.json();
  const partId = parts[0].id as string;

  const response = await request.post(`/api/parts/${partId}/images`, {
    data: {
      filename: 'test.png',
      mimeType: 'image/png',
      sizeBytes: 100,
      data: TINY_PNG_BASE64,
    },
  });
  expect(response.status()).toBe(401);
});

test('api: POST /api/parts/[id]/images with invalid mime returns 400', async ({ request }) => {
  const partsResponse = await request.get('/api/parts');
  expect(partsResponse.status()).toBe(200);
  const parts = await partsResponse.json();
  const partId = parts[0].id as string;

  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.post(`/api/parts/${partId}/images`, {
    headers,
    data: {
      filename: 'test.exe',
      mimeType: 'application/x-msdownload',
      sizeBytes: 100,
      data: TINY_PNG_BASE64,
    },
  });
  expect(response.status()).toBe(400);
});
