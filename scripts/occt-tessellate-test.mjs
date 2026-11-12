// Playwright test script for OCCT tessellation
// Tests the tessellation service by loading the existing POC page

import { chromium } from 'playwright';

async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const logs = [];
  const errors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
  });

  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  console.log('Navigation vers /occt-poc-test...');
  await page.goto('http://localhost:3000/occt-poc-test', { waitUntil: 'networkidle' });

  // Wait for WASM to load and extraction to complete
  console.log('Attente du chargement WASM et tessellation (30s)...');
  await page.waitForTimeout(30000);

  const pageState = await page.evaluate(() => ({
    hasLoading: document.body.innerText.includes('Chargement'),
    hasError: document.body.innerText.includes('Erreur'),
    hasCanvas: !!document.querySelector('canvas'),
  }));

  console.log('Page state:', pageState);
  console.log('=== LOGS CONSOLE ===');
  logs.forEach((log) => console.log(log));

  if (errors.length > 0) {
    console.log('=== ERREURS PAGE ===');
    errors.forEach((err) => console.log(err));
  }

  // Capture screenshot
  await page.screenshot({ path: 'occt-tessellate-screenshot.png', fullPage: true });
  console.log('Capture terminée : occt-tessellate-screenshot.png');

  // Save page HTML for inspection
  const html = await page.content();
  const fs = await import('fs');
  fs.writeFileSync('occt-tessellate-page.html', html);

  await browser.close();

  // Check for tessellation logs
  const tessellateLogs = logs.filter(
    (l) => l.includes('tessellate') || l.includes('Extraction done') || l.includes('vertices'),
  );
  console.log('=== TESSELLATION LOGS ===');
  tessellateLogs.forEach((log) => console.log(log));

  return { pageState, logs, errors };
}

runTest().catch(console.error);
