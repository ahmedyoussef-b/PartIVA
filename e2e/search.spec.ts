import { test, expect } from '@playwright/test';
import 'dotenv/config'; // charge .env (HF_API_URL…) — nécessaire pour les skips conditionnels (isLightweight)
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

test('api: POST /api/search without auth returns 401', async ({ request }) => {
  const response = await request.post('/api/search', { data: {} });
  expect(response.status()).toBe(401);
});

test('api: POST /api/search with auth returns 200 and JSON array', async ({ request }) => {
  const { headers } = await authRequest(request, 'ADMIN');
  const response = await request.post('/api/search', { headers, data: {} });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

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

test.describe('Recherche multi-critères', () => {
  test('multi avec q seul → 200', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/search?mode=multi&q=roulement', {
      headers,
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.mode).toBe('multi');
    expect(body.count).toBeGreaterThan(0);
    for (const result of body.results) {
      expect(typeof result.score).toBe('number');
      expect(result.breakdown).toHaveProperty('text');
    }
  });

  test('multi avec reference seule → 200', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/search?mode=multi&reference=PTV-2026', {
      headers,
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.mode).toBe('multi');
    expect(body.count).toBeGreaterThan(0);
    for (const result of body.results) {
      expect(typeof result.score).toBe('number');
      expect(result.breakdown).toHaveProperty('reference');
    }
  });

  test('multi sans critère → 400', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/search?mode=multi', { headers });
    expect(response.status()).toBe(400);
  });

  test('multi retourne score + breakdown', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get(
      '/api/search?mode=multi&q=roulement&reference=PTV-2026&min=20&max=30',
      { headers },
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.mode).toBe('multi');
    expect(body.count).toBeGreaterThan(0);
    for (const result of body.results) {
      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(typeof result.breakdown).toBe('object');
      expect(Object.keys(result.breakdown).length).toBeGreaterThan(0);
    }
    const sorted = [...body.results].sort(
      (a: { score: number }, b: { score: number }) => b.score - a.score,
    );
    expect(body.results).toEqual(sorted);
  });
});

test.describe('Recherche par photo', () => {
  // 1×1 PNG valide (base64) — payload minimal accepté par la route.
  const PNG_1PX_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  test('photo POST /api/search/photo without auth returns 401', async ({ request }) => {
    const response = await request.post('/api/search/photo', {
      data: { mimeType: 'image/png', data: PNG_1PX_BASE64 },
    });
    expect(response.status()).toBe(401);
  });

  test('photo POST /api/search/photo with invalid mime returns 400', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.post('/api/search/photo', {
      headers,
      data: { mimeType: 'image/gif', data: PNG_1PX_BASE64 },
    });
    expect(response.status()).toBe(400);
  });

  test('photo POST /api/search/photo without HF token returns 503', async ({ request }) => {
    test.skip(
      Boolean(process.env.HF_API_TOKEN),
      "HF_API_TOKEN défini — le chemin 503 ne s'applique pas",
    );
    const hfUrl = String(process.env.HF_API_URL ?? '');
    test.skip(
      hfUrl.includes('localhost') || hfUrl.includes('127.0.0.1') || hfUrl.includes('hf.space'),
      'provider lightweight (isLightweight) — chemin 503 inapplicable',
    );
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.post('/api/search/photo', {
      headers,
      data: { mimeType: 'image/png', data: PNG_1PX_BASE64 },
    });
    expect(response.status()).toBe(503);
    const body = await response.json();
    expect(String(body.message)).toContain('HF_API_TOKEN');
  });

  test('photo POST /api/search/photo with valid image returns 200 (si token HF)', async ({
    request,
  }) => {
    test.skip(!process.env.HF_API_TOKEN, 'HF_API_TOKEN absent — chemin succès non testable');
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.post('/api/search/photo', {
      headers,
      data: { mimeType: 'image/png', data: PNG_1PX_BASE64, limit: 20 },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.mode).toBe('photo');
    expect(typeof body.count).toBe('number');
    expect(Array.isArray(body.results)).toBe(true);
  });
});

// ============================================================================
// E12-R1b — Filtres + tri + pagination (mode=multi uniquement)
// ============================================================================

test.describe('Recherche avancée — filtres', () => {
  test('multi avec filter material → 200 et résultats filtrés', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/search?mode=multi&q=abs&material=ABS', { headers });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.mode).toBe('multi');
    expect(body.results.length).toBeGreaterThan(0);
    body.results.forEach((r: { material: string | null }) => {
      expect(r.material).toBe('ABS');
    });
  });

  test('multi avec filter status → 200 et résultats filtrés', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/search?mode=multi&q=roulement&status=SUBMITTED', {
      headers,
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.results.length).toBeGreaterThan(0);
    body.results.forEach((r: { status: string }) => {
      expect(r.status).toBe('SUBMITTED');
    });
  });

  test('multi avec filter createdAfter → 200 et résultats filtrés', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const after = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();
    const response = await request.get(`/api/search?mode=multi&q=roulement&createdAfter=${after}`, {
      headers,
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.results.length).toBeGreaterThan(0);
    body.results.forEach((r: { createdAt: string }) => {
      expect(new Date(r.createdAt).getTime()).toBeGreaterThanOrEqual(new Date(after).getTime());
    });
  });

  test('multi avec filter createdBefore → 200 et résultats filtrés', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const before = new Date().toISOString();
    const response = await request.get(
      `/api/search?mode=multi&q=roulement&createdBefore=${before}`,
      { headers },
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.results.length).toBeGreaterThan(0);
    body.results.forEach((r: { createdAt: string }) => {
      expect(new Date(r.createdAt).getTime()).toBeLessThanOrEqual(new Date(before).getTime());
    });
  });

  test('multi avec filter minScore → 200 et scores ≥ seuil', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/search?mode=multi&q=roulement&minScore=0.5', {
      headers,
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.results.length).toBeGreaterThan(0);
    body.results.forEach((r: { score: number }) => {
      expect(r.score).toBeGreaterThanOrEqual(0.5);
    });
  });
});

test.describe('Recherche avancée — tri', () => {
  test('multi avec sort=date → 200 et tri décroissant', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/search?mode=multi&q=roulement&sort=date', { headers });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.results.length).toBeGreaterThan(0);
    const dates = body.results.map((r: { createdAt: string }) => new Date(r.createdAt).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
    }
  });

  test('multi avec sort=name → 200 et tri alphabétique', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/search?mode=multi&q=roulement&sort=name', { headers });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.results.length).toBeGreaterThan(0);
    const names = body.results.map((r: { name: string | null }) => r.name ?? '');
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  test('multi avec sort=relevance (défaut) → 200 et tri score desc', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/search?mode=multi&q=roulement', { headers });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.results.length).toBeGreaterThan(0);
    const scores = body.results.map((r: { score: number }) => r.score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });
});

test.describe('Recherche avancée — pagination', () => {
  test('multi avec limit=5 → 200 et count ≤ 5', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/search?mode=multi&q=roulement&limit=5', { headers });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.count).toBeGreaterThan(0);
    expect(body.count).toBeLessThanOrEqual(5);
    expect(body.limit).toBe(5);
  });

  test('multi avec offset=1 → 200 et résultats décalés', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/search?mode=multi&q=roulement&offset=1&limit=10', {
      headers,
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.offset).toBe(1);
    expect(body.results.length).toBeGreaterThan(0);
  });

  test('multi avec limit + offset → 200 et hasMore cohérent', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/search?mode=multi&q=roulement&limit=2&offset=0', {
      headers,
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.count).toBeGreaterThan(0);
    expect(typeof body.hasMore).toBe('boolean');
    expect(typeof body.total).toBe('number');
    expect(body.total).toBeGreaterThanOrEqual(body.count);
  });
});

// ============================================================================
// E12-R1c — Facettes (/api/search/facets)
// ============================================================================

test.describe('Recherche avancée — facettes', () => {
  test('facets avec q=roulement → 200 et materials/statuses non vides', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/search/facets?q=roulement', { headers });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.total).toBe('number');
    expect(Array.isArray(body.materials)).toBe(true);
    expect(Array.isArray(body.statuses)).toBe(true);
    expect(body.statuses.length).toBeGreaterThan(0);
  });

  test('facets avec material=ABS → 200 et total cohérent', async ({ request }) => {
    const { headers } = await authRequest(request, 'ADMIN');
    const response = await request.get('/api/search/facets?material=ABS', { headers });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.total).toBeGreaterThanOrEqual(0);
    body.materials.forEach((m: { value: string; count: number }) => {
      expect(m.value).toBe('ABS');
      expect(m.count).toBeGreaterThan(0);
    });
  });

  test('facets sans auth → 401', async ({ request }) => {
    const response = await request.get('/api/search/facets?q=roulement');
    expect(response.status()).toBe(401);
  });
});

// ============================================================================
// E12-R1d — UI filtres + tri + facettes + pagination
// ============================================================================

test.describe('Recherche avancée — UI', () => {
  test('panneau de filtres visible en mode multi', async ({ page }) => {
    await authRequest(page.request, 'ADMIN'); // page.request partage le cookie jar de la page
    await page.goto('/admin/recherche');
    await page.getByRole('tab', { name: 'Multi' }).click();
    await page.getByRole('button', { name: /Filtres avancés/ }).click();
    await expect(page.getByText('Matériau', { exact: true })).toBeVisible();
    await expect(page.getByText('Créé après', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Tri')).toBeVisible();
  });

  test('tri change la valeur sélectionnée', async ({ page }) => {
    await authRequest(page.request, 'ADMIN');
    await page.goto('/admin/recherche');
    await page.getByRole('tab', { name: 'Multi' }).click();
    await page.getByLabel('Recherche texte').fill('roulement');
    await page.waitForTimeout(800);
    const sortSelect = page.getByLabel('Tri');
    await expect(sortSelect).toBeVisible();
    await sortSelect.selectOption('date');
    await expect(sortSelect).toHaveValue('date');
    await page.waitForTimeout(600); // laisser le re-fetch terminer sans réinitialiser l'affichage
    await expect(sortSelect).toHaveValue('date');
  });

  test('facette cliquable ajoute le filtre correspondant', async ({ page }) => {
    await authRequest(page.request, 'ADMIN');
    await page.goto('/admin/recherche');
    await page.getByRole('tab', { name: 'Multi' }).click();
    await page.getByLabel('Recherche texte').fill('roulement');
    const firstFacet = page.locator('[aria-pressed]').first();
    await expect(firstFacet).toBeVisible({ timeout: 10_000 });
    await firstFacet.click();
    await expect(page.locator('[aria-pressed="true"]')).toHaveCount(1);
  });
});
