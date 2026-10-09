import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
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

// Récupère un contexte de requête authentifié pour un rôle donné
async function authRequest(
  request: import('@playwright/test').APIRequestContext,
  role: 'ADMIN' | 'USER' | 'VIEWER',
) {
  const user = users[role];
  const storage = JSON.parse(await readFile(user.storageStatePath, 'utf-8'));
  const cookies = storage.cookies ?? [];
  const headers: Record<string, string> = {};
  for (const c of cookies) {
    headers['cookie'] = headers['cookie']
      ? `${headers['cookie']}; ${c.name}=${c.value}`
      : `${c.name}=${c.value}`;
  }
  return { headers };
}

test('api: POST /api/parts/[id]/transition without auth returns 401', async ({ request }) => {
  const partId = await getFirstPartId(request);
  const response = await request.post(`/api/parts/${partId}/transition`, {
    data: { toStatus: 'IDENTIFYING' },
  });
  expect(response.status()).toBe(401);
});

test('api: POST /api/parts/[id]/transition with invalid toStatus returns 400', async ({
  request,
}) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.post(`/api/parts/${partId}/transition`, {
    data: { toStatus: 'NOT_A_REAL_STATUS' },
    headers,
  });
  expect(response.status()).toBe(400);
});

async function getPartIdByStatus(
  request: import('@playwright/test').APIRequestContext,
  status: string,
): Promise<string> {
  const response = await request.get('/api/parts');
  expect(response.status()).toBe(200);
  const parts = await response.json();
  const part = parts.find((p: { status: string }) => p.status === status);
  if (!part) {
    throw new Error(`No part with status ${status} in seed`);
  }
  return part.id as string;
}

test('api: POST /api/parts/[id]/transition ADMIN SUBMITTED->IDENTIFYING returns 200', async ({
  request,
}) => {
  const partId = await getPartIdByStatus(request, 'SUBMITTED');
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.post(`/api/parts/${partId}/transition`, {
    data: { toStatus: 'IDENTIFYING', reason: 'E2E test admin transition' },
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe('IDENTIFYING');
});

test('api: POST /api/parts/[id]/transition VIEWER returns 403', async ({ request }) => {
  const partId = await getPartIdByStatus(request, 'SUBMITTED');
  const { headers } = await authRequest(request, 'VIEWER');
  const response = await request.post(`/api/parts/${partId}/transition`, {
    data: { toStatus: 'IDENTIFYING' },
    headers,
  });
  expect(response.status()).toBe(403);
});

test('api: POST /api/parts/[id]/transition impossible DRAFT->DELIVERED returns 409', async ({
  request,
}) => {
  const partId = await getFirstPartId(request);
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.post(`/api/parts/${partId}/transition`, {
    data: { toStatus: 'DELIVERED' },
    headers,
  });
  expect(response.status()).toBe(409);
});

test('api: POST /api/parts/[id]/transition USER on another client part returns 403', async ({
  request,
}) => {
  // Récupérer une pièce qui n'appartient pas au USER (clientId différent de user.id)
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

  // Si aucune pièce d'un autre client n'existe, on teste quand même le 403
  // en tentant une transition sur une pièce sans client (clientId null).
  const targetPart = otherPart ?? parts.find((p: { clientId?: string | null }) => !p.clientId);

  if (!targetPart) {
    test.skip();
    return;
  }

  const response = await request.post(`/api/parts/${targetPart.id}/transition`, {
    data: { toStatus: 'IDENTIFYING' },
    headers,
  });
  expect(response.status()).toBe(403);
});
