import { test as base } from '@playwright/test';
import { loadIds, type DynamicIds } from './dynamic-ids';

export const test = base.extend<{ dynamicIds: DynamicIds }>({
  dynamicIds: async ({}, use) => {
    const ids = loadIds();
    await use(ids);
  },
});

export { expect } from '@playwright/test';
