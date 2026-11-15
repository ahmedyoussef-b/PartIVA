import { test, expect, type Page } from '@playwright/test';

async function mockChat(page: Page) {
  await page.route('**/api/ai/chat', async (route) => {
    const body = route.request().postDataJSON() as { message?: string };
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ reply: `[MOCK] ${body?.message ?? ''}`, source: 'mock' }),
    });
  });
}

async function waitForChatHydrated(page: Page) {
  await page.waitForFunction(() => {
    const el = document.querySelector('textarea[placeholder="Posez votre question..."]');
    return !!el && Object.keys(el).some((k) => k.startsWith('__reactProps'));
  });
}

async function sendMessage(page: Page, text: string) {
  const input = page.getByPlaceholder('Posez votre question...');
  await input.evaluate((el, v) => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value',
    )!.set!;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, text);
  await page.getByRole('button', { name: /envoyer/i }).click();
}

test.describe('Assistant chat (squelette V8-D-5 T2)', () => {
  test('round-trip message -> mock reply', async ({ page }) => {
    await mockChat(page);
    await page.goto('/workspace');
    await waitForChatHydrated(page);
    const question = 'Question E2E round-trip';
    await sendMessage(page, question);
    await expect(page.getByText(`[MOCK] ${question}`)).toBeVisible();
  });

  test('MessageList 2 messages -> 2 replies', async ({ page }) => {
    await mockChat(page);
    await page.goto('/workspace');
    await waitForChatHydrated(page);
    await sendMessage(page, 'Premier message');
    await expect(page.getByText('[MOCK] Premier message')).toBeVisible();
    await sendMessage(page, 'Second message');
    await expect(page.getByText('[MOCK] Second message')).toBeVisible();
  });
});
