import { type BrowserContext, type Page, expect } from '@playwright/test';

/**
 * Generate a random 6-digit room code for tests.
 */
export function randomCode(): string {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

/**
 * Wait briefly for WebSocket events to settle.
 * The app uses PartyKit realtime → events typically arrive within ~300ms.
 */
export async function waitForRealtime(page: Page, ms = 800): Promise<void> {
  await page.waitForTimeout(ms);
}

/**
 * Create a fresh BrowserContext to simulate a separate device.
 * Each context has its own localStorage / sessionStorage.
 */
export async function newPlayerContext(
  browser: import('@playwright/test').Browser,
  opts: { displayName: string; avatarId?: string } = { displayName: 'Player' },
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  // Pre-seed localStorage with profile so forms prefill (skip onboarding)
  await context.addInitScript(({ name, avatar }) => {
    localStorage.setItem('wwc.displayName', name);
    if (avatar) localStorage.setItem('wwc.avatarId', avatar);
  }, { name: opts.displayName, avatar: opts.avatarId ?? null });

  const page = await context.newPage();
  return { context, page };
}

/**
 * Helper: host creates a room and returns the URL room code.
 */
export async function createRoomAsHost(
  page: Page,
  opts: { name: string; avatarId?: string } = { name: 'Host' },
): Promise<string> {
  const code = randomCode();
  await page.goto('/create');
  await page.waitForLoadState('networkidle');

  // Name input
  const nameInput = page.getByPlaceholder(/Ví dụ:|tên/i).first();
  await nameInput.fill(opts.name);

  // Room code input — find the 6-digit code input
  await page.getByRole('textbox', { name: /code|mã/i }).fill(code).catch(async () => {
    // Fallback: target by inputmode="numeric"
    const codeInput = page.locator('input[inputmode="numeric"]').first();
    await codeInput.fill(code);
  });

  // Submit
  const submitBtn = page.getByRole('button', { name: /Tạo phòng/i });
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  // Wait for lobby
  await page.waitForURL(new RegExp(`/lobby/${code}`));
  await waitForRealtime(page);
  return code;
}

/**
 * Helper: player joins a room by code.
 */
export async function joinRoomAsPlayer(
  page: Page,
  code: string,
  opts: { name: string; avatarId?: string } = { name: 'Player' },
): Promise<void> {
  await page.goto('/join');
  await page.waitForLoadState('networkidle');

  const nameInput = page.getByPlaceholder(/Ví dụ:|tên/i).first();
  await nameInput.fill(opts.name);

  await page.getByRole('textbox', { name: /code|mã/i }).fill(code).catch(async () => {
    const codeInput = page.locator('input[inputmode="numeric"]').first();
    await codeInput.fill(code);
  });

  const submitBtn = page.getByRole('button', { name: /Vào phòng/i });
  await expect(submitBtn).toBeEnabled();
  await submitBtn.click();

  await page.waitForURL(new RegExp(`/lobby/${code}`));
  await waitForRealtime(page);
}
