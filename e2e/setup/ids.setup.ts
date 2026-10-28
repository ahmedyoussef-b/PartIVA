import { test as setup, expect } from '@playwright/test';
import { saveIds, type DynamicIds } from '../fixtures/dynamic-ids';

setup('extract dynamic request ids from API', async ({ request }) => {
  const response = await request.get('/api/requests');

  // E2E-R5 – if the API fails because the DB is unavailable,
  // use fallback IDs from environment or seed data so tests can still run
  if (!response.ok()) {
    console.warn(`[ids.setup] GET /api/requests returned ${response.status()}, using fallback IDs`);
    const fallbackRequestId = process.env.E2E_FALLBACK_REQUEST_ID ?? 'req-fallback-001';
    const ids: DynamicIds = {
      request: fallbackRequestId,
      requestSearch: fallbackRequestId,
      requestClient: fallbackRequestId,
    };
    saveIds(ids);
    return;
  }

  const requests = (await response.json()) as Array<{ id: string }>;
  expect(requests.length).toBeGreaterThanOrEqual(1);

  const first = requests[0];
  if (!first) {
    throw new Error('No request found in seed – cannot extract dynamic ids');
  }

  const ids: DynamicIds = {
    request: first.id,
    requestSearch: first.id,
    requestClient: first.id,
  };

  saveIds(ids);
});
