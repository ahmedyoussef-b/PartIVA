import { test, expect } from '@playwright/test';

test.describe('PCB Design Review Engine', () => {
  test('should detect blocker for duplicate references', async ({ request }) => {
    const payload = {
      components: [
        { id: 'R1', refDes: 'R1', footprint: '0805' },
        { id: 'R2', refDes: 'R1', footprint: '0805' },
      ],
      nets: [],
    };

    const res = await request.post('/api/pcb/design-review/run', { data: payload });
    const report = await res.json();

    expect(report.isPassable).toBe(false);
    expect(report.summary.blocker).toBeGreaterThanOrEqual(1);
    expect(report.findings.some((f: { ruleId: string }) => f.ruleId === 'DR-002')).toBe(true);
  });

  test('should pass when no blockers and valid design', async ({ request }) => {
    const payload = {
      components: [
        { id: 'R1', refDes: 'R1', footprint: '0805', type: 'Resistor' },
        { id: 'C1', refDes: 'C1', footprint: '0603', type: 'Capacitor' },
      ],
      nets: [{ name: 'VCC', pins: [] }],
    };

    const res = await request.post('/api/pcb/design-review/run', { data: payload });
    const report = await res.json();

    expect(report.isPassable).toBe(true);
    expect(report.summary.blocker).toBe(0);
    expect(report.checkedRules).toBeGreaterThan(0);
  });

  test('should reject invalid payload', async ({ request }) => {
    const res = await request.post('/api/pcb/design-review/run', {
      data: { components: 'not-array', nets: [] },
    });
    expect(res.status()).toBe(400);
  });
});
