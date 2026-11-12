import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capturer tous les logs console
  const logs = [];
  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Capturer les erreurs
  const errors = [];
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });

  console.log('Navigation vers /occt-poc-test...');
  await page.goto('http://localhost:3000/occt-poc-test', { waitUntil: 'networkidle', timeout: 60000 });

  // Attendre le chargement du WASM (60s max)
  console.log('Attente du chargement WASM (60s)...');
  await page.waitForTimeout(60000);

  // Vérifier l'état de la page
  const loadingText = await page.textContent('body');
  const hasLoading = loadingText?.includes('Chargement');
  const hasError = loadingText?.includes('Erreur');
  const hasCanvas = await page.locator('canvas').count() > 0;

  console.log(`Page state: hasLoading=${hasLoading}, hasError=${hasError}, hasCanvas=${hasCanvas}`);

  // Capture d'écran
  await page.screenshot({ path: 'occt-poc-screenshot.png', fullPage: true });

  // Sauvegarder le HTML
  const html = await page.content();
  const fs = await import('node:fs/promises');
  await fs.writeFile('occt-poc-page.html', html);

  // Afficher les logs
  console.log('=== LOGS CONSOLE ===');
  logs.forEach((log) => console.log(log));
  console.log('=== ERREURS PAGE ===');
  errors.forEach((err) => console.error(err));

  await browser.close();
  console.log('Capture terminée : occt-poc-screenshot.png');
})();