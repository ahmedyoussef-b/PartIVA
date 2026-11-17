import { test, expect } from '@playwright/test';

test.describe('PCB Sourcing Engine', () => {
  test('should match exact MPN and return pricing', async ({ request }) => {
    const payload = {
      bomItems: [
        { reference: 'U1', mpn: 'STM32F405RGT6', description: 'MCU ARM Cortex-M4', quantity: 2 },
      ],
    };

    const response = await request.post('/api/pcb/sourcing/engine', { data: payload });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.results).toHaveLength(1);
    expect(result.results[0].reference).toBe('U1');
    expect(result.results[0].totalCost).toBeGreaterThanOrEqual(0);
  });

  test('should return alternatives when no exact match', async ({ request }) => {
    const payload = {
      bomItems: [
        { reference: 'R1', mpn: 'NONEXISTENT-MPN', description: 'Resistor 10k 0805', quantity: 10 },
      ],
    };

    const response = await request.post('/api/pcb/sourcing/engine', { data: payload });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.results[0]).toHaveProperty('alternatives');
    expect(result.results[0]).toHaveProperty('isAvailable');
  });

  test('should reject invalid payload', async ({ request }) => {
    const response = await request.post('/api/pcb/sourcing/engine', {
      data: { bomItems: 'not-an-array' },
    });
    expect(response.status()).toBe(400);
  });
});
