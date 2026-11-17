import { test, expect } from '@playwright/test';

test.describe('PCB Catalog Sync', () => {
  test('should sync components from web to local', async ({ request }) => {
    const payload = {
      components: [
        {
          mpn: 'STM32F405RGT6',
          name: 'MCU ARM Cortex-M4',
          footprint: 'LQFP64',
          price: 8.5,
          stock: 150,
          category: 'mcu',
          symbol: 'STM32F405',
        },
        {
          mpn: '0805W8F1002T5E',
          name: 'Resistor 10k',
          footprint: '0805',
          price: 0.01,
          stock: 5000,
          category: 'resistor',
          symbol: 'R',
        },
      ],
    };

    const response = await request.post('/api/pcb/catalog/sync', {
      data: payload,
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.synced).toBe(2);
    expect(result.message).toContain('synchronisé');
  });

  test('should reject invalid payload', async ({ request }) => {
    const response = await request.post('/api/pcb/catalog/sync', {
      data: { components: 'not-an-array' },
    });

    expect(response.status()).toBe(400);
  });
});
