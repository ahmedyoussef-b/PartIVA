import { test, expect } from '@playwright/test';

test.describe('PCB Export (BOM + Gerber)', () => {
  test('should export BOM as XLSX', async ({ request }) => {
    const payload = {
      components: [
        {
          id: 'R1',
          refDes: 'R1',
          mpn: '0805W8F1002T5E',
          description: 'Resistor 10k',
          quantity: 2,
          price: 0.01,
        },
        {
          id: 'R2',
          refDes: 'R2',
          mpn: '0805W8F1002T5E',
          description: 'Resistor 10k',
          quantity: 1,
          price: 0.01,
        },
      ],
      format: 'xlsx',
      includePricing: true,
    };

    const res = await request.post('/api/pcb/export/bom', { data: payload });
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toContain('spreadsheetml');
    expect(res.headers()['content-disposition']).toContain('.xlsx');
  });

  test('should export Gerber ZIP', async ({ request }) => {
    const payload = { projectId: 'TEST-001', layers: ['F.Cu', 'Edge.Cuts'] };

    const res = await request.post('/api/pcb/export/gerber', { data: payload });
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type']).toBe('application/zip');
    expect(res.headers()['content-disposition']).toContain('.zip');
  });

  test('should reject invalid BOM payload', async ({ request }) => {
    const res = await request.post('/api/pcb/export/bom', { data: { components: 'not-array' } });
    expect(res.status()).toBe(400);
  });
});
