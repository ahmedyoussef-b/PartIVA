import { test, expect } from '@playwright/test';

test('backfill script exits 0 without HF_API_TOKEN (graceful degradation)', async () => {
  const env = { ...process.env };
  delete env.HF_API_TOKEN;

  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execFileAsync = promisify(execFile);

  const { stdout, stderr } = await execFileAsync('npx', ['tsx', 'scripts/backfill-embeddings.ts'], {
    env,
    cwd: process.cwd(),
    maxBuffer: 1024 * 1024,
    shell: true,
  });

  const output = stdout + stderr;
  expect(output).toContain('HF_API_TOKEN absent');
  expect(output).not.toContain('BACKFILL_ERROR');
});
