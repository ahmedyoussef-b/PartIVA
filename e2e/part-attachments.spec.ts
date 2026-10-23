import { test, expect } from '@playwright/test';
import { users } from './fixtures/users';

// L'upload d'attachement repose sur Cloudinary (src/lib/upload.ts). En l'absence
// de CLOUDINARY_API_SECRET (local / CI sans Cloudinary), les tests qui créent un
// attachement ne peuvent pas aboutir (POST /attachments renvoie 400) : on les saute.
const cloudinaryConfigured = Boolean(process.env.CLOUDINARY_API_SECRET);

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
      await new Promise(resolve => setTimeout(resolve, delay));
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

test('api: GET /api/parts/[id]/attachments without auth returns 401', async ({
  request,
  playwright,
}) => {
  const partId = '00000000-0000-0000-0000-000000000000';
  const response = await request.get(`/api/parts/${partId}/attachments`);
  expect(response.status()).toBe(401);
});

test('api: GET /api/parts/[id]/attachments with auth returns 200 and JSON array', async ({
  request,
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(`/api/parts/${partId}/attachments`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('api: POST /api/parts/[id]/attachments creates an attachment', async ({
  request,
  playwright,
}) => {
  if (!cloudinaryConfigured) {
    test.skip();
    return;
  }
  const partId = await getFirstPartId(playwright);
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
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.post(`/api/parts/${partId}/attachments`, {
    headers,
    data: { name: 'missing-data.pdf' },
  });
  expect(response.status()).toBe(400);
});

test('api: DELETE /api/parts/[id]/attachments/[attachmentId] returns 204', async ({
  request,
  playwright,
}) => {
  if (!cloudinaryConfigured) {
    test.skip();
    return;
  }
  const partId = await getFirstPartId(playwright);
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
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.delete(
    `/api/parts/${partId}/attachments/00000000-0000-0000-0000-000000000000`,
    { headers },
  );
  expect(response.status()).toBe(404);
});

test('api: POST /api/parts/[id]/attachments without auth returns 401', async ({
  request,
  playwright,
}) => {
  const partId = '00000000-0000-0000-0000-000000000000';
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
  playwright,
}) => {
  const partId = await getFirstPartId(playwright);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.delete(
    `/api/parts/${partId}/images/00000000-0000-0000-0000-000000000000`,
    { headers },
  );
  expect(response.status()).toBe(404);
});
