import { test, expect } from '@playwright/test';

test.describe('PCB Real State Analysis', () => {
  test('should detect critical current violation on 0805', async ({ request }) => {
    const payload = {
      components: [{ id: 'R1', footprint: '0805', currentDrawn: 1.0 }],
      nets: [
        {
          name: 'GND',
          pins: [
            { componentId: 'R1', pinName: '1' },
            { componentId: 'U1', pinName: 'GND' },
          ],
        },
      ],
    };

    const res = await request.post('/api/pcb/simulate', { data: payload });
    const result = await res.json();

    expect(result.isCompliant).toBe(false);
    expect(result.violations.some((v: { type: string }) => v.type === 'CURRENT_CAPACITY')).toBe(
      true,
    );
  });

  test('should pass when GND is properly connected', async ({ request }) => {
    const payload = {
      components: [{ id: 'R1', footprint: '0603', currentDrawn: 0.1 }],
      nets: [
        {
          name: 'GND',
          pins: [
            { componentId: 'R1', pinName: '1' },
            { componentId: 'U1', pinName: 'GND' },
          ],
        },
      ],
    };

    const res = await request.post('/api/pcb/simulate', { data: payload });
    const result = await res.json();

    expect(result.isCompliant).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  test('should reject invalid payload', async ({ request }) => {
    const res = await request.post('/api/pcb/simulate', {
      data: { components: 'invalid', nets: [] },
    });
    expect(res.status()).toBe(400);
  });
});
