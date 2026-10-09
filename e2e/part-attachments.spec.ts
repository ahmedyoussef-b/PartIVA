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

test('api: GET /api/parts/[id]/attachments without auth returns 401', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const response = await request.get(`/api/parts/${partId}/attachments`);
  expect(response.status()).toBe(401);
});

test('api: GET /api/parts/[id]/attachments with auth returns 200 and JSON array', async ({
  request,
}) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(`/api/parts/${partId}/attachments`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('api: POST /api/parts/[id]/attachments creates an attachment', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');

  const name = `e2e-att-${Date.now()}.pdf`;
  const response = await request.post(`/api/parts/${partId}/attachments`, {
    headers,
    data: {
      name,
      fileType: 'PDF',
      kind: 'DOCUMENT',
      mimeType: 'application/pdf',
      data: 'JVBERi0xLjQK',
    },
  });
  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.name).toBe(name);
  expect(body.fileType).toBe('PDF');
  expect(body.kind).toBe('DOCUMENT');
  expect(body.mimeType).toBe('application/pdf');
  expect(body.url).toBeTruthy();
  expect(body.publicId).toBeTruthy();
  expect(body.partId).toBe(partId);
});

test('api: POST /api/parts/[id]/attachments with invalid payload returns 400', async ({
  request,
}) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.post(`/api/parts/${partId}/attachments`, {
    headers,
    data: { name: 'missing-data.pdf' },
  });
  expect(response.status()).toBe(400);
});

test('api: DELETE /api/parts/[id]/attachments/[attachmentId] returns 204', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');

  const created = await request.post(`/api/parts/${partId}/attachments`, {
    headers,
    data: {
      name: `e2e-del-${Date.now()}.pdf`,
      fileType: 'PDF',
      kind: 'DOCUMENT',
      mimeType: 'application/pdf',
      data: 'JVBERi0xLjQK',
    },
  });
  expect(created.status()).toBe(201);
  const attachment = await created.json();

  const deleted = await request.delete(`/api/parts/${partId}/attachments/${attachment.id}`, {
    headers,
  });
  expect(deleted.status()).toBe(204);

  const list = await request.get(`/api/parts/${partId}/attachments`, {
    headers,
  });
  expect(list.status()).toBe(200);
  const body = await list.json();
  expect(body.find((a: { id: string }) => a.id === attachment.id)).toBeUndefined();
});

test('api: DELETE /api/parts/[id]/attachments/[attachmentId] unknown returns 404', async ({
  request,
}) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.delete(
    `/api/parts/${partId}/attachments/00000000-0000-0000-0000-000000000000`,
    { headers },
  );
  expect(response.status()).toBe(404);
});

test('api: POST /api/parts/[id]/attachments without auth returns 401', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const response = await request.post(`/api/parts/${partId}/attachments`, {
    data: {
      name: 'no-auth.pdf',
      fileType: 'PDF',
      kind: 'DOCUMENT',
      mimeType: 'application/pdf',
      data: 'JVBERi0xLjQK',
    },
  });
  expect(response.status()).toBe(401);
});

test('api: GET /api/parts/[id]/images/[imageId] DELETE unknown image returns 404', async ({
  request,
}) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.delete(
    `/api/parts/${partId}/images/00000000-0000-0000-0000-000000000000`,
    { headers },
  );
  expect(response.status()).toBe(404);
});
