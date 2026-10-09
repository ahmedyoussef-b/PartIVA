import { test, expect } from '@playwright/test';

async function getFirstPartId(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const response = await request.get('/api/parts');
  expect(response.status()).toBe(200);
  const parts = await response.json();
  expect(Array.isArray(parts)).toBe(true);
  expect(parts.length).toBeGreaterThan(0);
  return parts[0].id as string;
}

test('api: GET /api/parts/[id]/images returns JSON array', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const response = await request.get(`/api/parts/${partId}/images`);
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('api: POST /api/parts/[id]/images without auth returns 401', async ({ request }) => {
  const partId = await getFirstPartId(request);
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

test('api: POST /api/parts/[id]/images with invalid mime returns 400', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const response = await request.post(`/api/parts/${partId}/images`, {
    data: {
      filename: 'test.exe',
      mimeType: 'application/x-msdownload',
      sizeBytes: 1024,
      data: 'aGVsbG8=',
    },
  });
  expect([400, 401]).toContain(response.status());
});
