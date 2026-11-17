import { test, expect } from '@playwright/test';

test.describe('PCB Autoroute (Freerouting Integration)', () => {
  test('should generate DSN content for valid components and nets', async ({ request }) => {
    const payload = {
      components: [
        { id: 'U1', x: 100, y: 100, footprint: 'SOIC-8' },
        { id: 'R1', x: 200, y: 100, footprint: '0805' },
      ],
      nets: [
        {
          name: 'VCC',
          pins: [
            { componentId: 'U1', pinName: 'VCC' },
            { componentId: 'R1', pinName: '1' },
          ],
        },
      ],
    };

    const response = await request.post('/api/pcb/autoroute', {
      data: payload,
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.status).toBe('success');
    expect(result.dsnContent).toContain('(PCB');
    expect(result.dsnContent).toContain('U1');
    expect(result.dsnContent).toContain('VCC');
  });

  test('should return error for missing data', async ({ request }) => {
    const response = await request.post('/api/pcb/autoroute', {
      data: {},
    });

    expect(response.status()).toBe(400);
  });
});
