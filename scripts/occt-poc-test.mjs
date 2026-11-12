import { test } from '@playwright/test';
import { writeFileSync } from 'fs';

test('OCCT POC page renders cube', async ({ page }) => {
  const logs: string[] = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    logs.push(`[pageerror] ${err.message}`);
  });

  await page.goto('http://localhost:3000/admin/reverse-engineering/occt-test', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  await page.waitForTimeout(5000);

  const screenshot = await page.screenshot({ fullPage: true });
  writeFileSync('occt-poc-screenshot.png', screenshot);

  const content = await page.content();
  writeFileSync('occt-poc-page.html', content);

  console.log('=== PAGE CONTENT (first 2000 chars) ===');
  console.log(content.slice(0, 2000));
  console.log('=== CONSOLE LOGS ===');
  logs.forEach(l => console.log(l));
});
