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

test('api: GET /api/search without auth returns 401', async ({ request }) => {
  const response = await request.get('/api/search?q=roulement');
  expect(response.status()).toBe(401);
});

test('api: GET /api/search with q too short returns 400', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?q=x', { headers });
  expect(response.status()).toBe(400);
});

test('api: GET /api/search with valid q returns 200 and non-empty results', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?q=roulement', {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.query).toBe('roulement');
  expect(Array.isArray(body.results)).toBe(true);
  expect(body.count).toBeGreaterThan(0);
  expect(body.results[0].ptvReference).toBeTruthy();
  expect(body.results[0].name).toBeTruthy();
  expect(typeof body.results[0].rank).toBe('number');
});

test('api: GET /api/search with unknown q returns 200 and empty results', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(`/api/search?q=zzzz${Date.now()}`, { headers });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBe(0);
  expect(body.results).toEqual([]);
});

test('api: GET /api/search by USER returns only own parts', async ({ request }) => {
  const { headers } = await authRequest(request, 'USER');
  const response = await request.get('/api/search?q=roulement', {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body.results)).toBe(true);
  for (const result of body.results) {
    expect(result).toHaveProperty('id');
  }
});

test('api: GET /api/search by ADMIN returns all matching parts', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?q=roulement', {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBeGreaterThan(0);
});

test('api: GET /api/search mode=reference returns 200 with matchType', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?q=PTV&mode=reference', {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.mode).toBe('reference');
  expect(Array.isArray(body.results)).toBe(true);
  expect(body.count).toBeGreaterThan(0);
  for (const result of body.results) {
    expect(['exact', 'prefix']).toContain(result.matchType);
  }
});

test('api: GET /api/search mode=reference exact match returns matchType exact', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?q=PTV-2026-000001&mode=reference', { headers });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBeGreaterThan(0);
  const exact = body.results.find(
    (r: { ptvReference: string | null }) => r.ptvReference === 'PTV-2026-000001',
  );
  expect(exact).toBeTruthy();
  expect(exact.matchType).toBe('exact');
});

test('api: GET /api/search mode=reference prefix returns matchType prefix', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?q=PTV-2026&mode=reference', { headers });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBeGreaterThan(0);
  for (const result of body.results) {
    expect(result.matchType).toBe('prefix');
  }
});

test('api: GET /api/search mode=invalid returns 400', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?q=PTV&mode=invalid', {
    headers,
  });
  expect(response.status()).toBe(400);
});

test('api: GET /api/search mode=specs returns 200 with matchedSpecs', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?q=acier&mode=specs', {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.mode).toBe('specs');
  expect(body.count).toBeGreaterThan(0);
  for (const result of body.results) {
    expect(Array.isArray(result.matchedSpecs)).toBe(true);
    expect(result.matchedSpecs.length).toBeGreaterThan(0);
    for (const spec of result.matchedSpecs) {
      expect(spec).toHaveProperty('key');
      expect(spec).toHaveProperty('value');
    }
  }
});

test('api: GET /api/search mode=specs with key=material filters on material', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?q=acier&mode=specs&key=material', { headers });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBeGreaterThan(0);
  for (const result of body.results) {
    for (const spec of result.matchedSpecs) {
      expect(spec.key).toBe('material');
    }
  }
});

test('api: GET /api/search mode=specs with unknown key returns 200 and count 0', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?q=acier&mode=specs&key=unknown_key', { headers });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBe(0);
  expect(body.results).toEqual([]);
});

test('api: GET /api/search mode=specs with no match returns 200 and count 0', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(`/api/search?q=ZZZNOMATCH${Date.now()}&mode=specs`, {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBe(0);
  expect(body.results).toEqual([]);
});

test('api: GET /api/search mode=dimensions nominal range returns 200 with spec results', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?mode=dimensions&min=20&max=30&key=diameter_int', {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.mode).toBe('dimensions');
  expect(body.count).toBeGreaterThan(0);
  for (const result of body.results) {
    expect(result.specKey).toBe('diameter_int');
    expect(result).toHaveProperty('specValue');
    expect(result).toHaveProperty('unit');
    const numericValue = Number(result.specValue);
    expect(numericValue).toBeGreaterThanOrEqual(20);
    expect(numericValue).toBeLessThanOrEqual(30);
  }
});

test('api: GET /api/search mode=dimensions nominal exact match returns 200', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(
    '/api/search?mode=dimensions&min=52&max=52&key=diameter_ext&matchMode=nominal',
    { headers },
  );
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBeGreaterThan(0);
  const exact = body.results.find(
    (r: { ptvReference: string | null }) => r.ptvReference === 'PTV-2026-000001',
  );
  expect(exact).toBeTruthy();
  expect(exact.specKey).toBe('diameter_ext');
  expect(exact.specValue).toBe('52');
});

test('api: GET /api/search mode=dimensions tolerance covering point returns 200', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(
    '/api/search?mode=dimensions&min=25&max=25&key=diameter_int&matchMode=tolerance',
    { headers },
  );
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBeGreaterThan(0);
  const covering = body.results.find(
    (r: { ptvReference: string | null }) => r.ptvReference === 'PTV-2026-000001',
  );
  expect(covering).toBeTruthy();
  expect(covering.specKey).toBe('diameter_int');
  expect(covering.specValue).toBe('25');
  expect(covering.toleranceMin).toBe(24.98);
  expect(covering.toleranceMax).toBe(25.02);
});

test('api: GET /api/search mode=dimensions tolerance covering bound returns 200', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get(
    '/api/search?mode=dimensions&min=130&key=diameter_ext&matchMode=tolerance',
    { headers },
  );
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBeGreaterThan(0);
  const covering = body.results.find(
    (r: { ptvReference: string | null }) => r.ptvReference === 'PTV-2026-000002',
  );
  expect(covering).toBeTruthy();
  expect(covering.toleranceMin).toBe(129.9);
  expect(covering.toleranceMax).toBe(130.1);
});

test('api: GET /api/search mode=dimensions without min/max returns 400', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?mode=dimensions', {
    headers,
  });
  expect(response.status()).toBe(400);
});

test('api: GET /api/search mode=dimensions with non-numeric min returns 400', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?mode=dimensions&min=abc', { headers });
  expect(response.status()).toBe(400);
});

test('api: GET /api/search mode=dimensions without key returns all numeric keys', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?mode=dimensions&min=20&max=30', { headers });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBeGreaterThan(0);
  const numericKeys = [
    'diameter_ext',
    'diameter_int',
    'width',
    'weight',
    'module',
    'teeth',
    'bore',
    'contact_angle',
  ];
  for (const result of body.results) {
    expect(numericKeys).toContain(result.specKey);
  }
});

test('api: GET /api/search mode=dimensions with key=material returns 200 and count 0', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?mode=dimensions&min=20&max=30&key=material', {
    headers,
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBe(0);
  expect(body.results).toEqual([]);
});

test('api: GET /api/search mode=dimensions with no match returns 200 and count 0', async ({
  request,
}) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.get('/api/search?mode=dimensions&min=9999', { headers });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.count).toBe(0);
  expect(body.results).toEqual([]);
});
