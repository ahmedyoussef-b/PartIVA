import { test as setup, expect } from '@playwright/test';
import { saveIds, type DynamicIds } from '../fixtures/dynamic-ids';

setup('extract dynamic request ids from API', async ({ request }) => {
  const response = await request.get('/api/requests');
  expect(response.ok()).toBeTruthy();

  const requests = (await response.json()) as Array<{ id: string }>;
  expect(requests.length).toBeGreaterThanOrEqual(1);

  const first = requests[0];
  if (!first) {
    throw new Error('No request found in seed — cannot extract dynamic ids');
  }

  const ids: DynamicIds = {
    request: first.id,
    requestSearch: first.id,
    requestClient: first.id,
  };

  saveIds(ids);
});
