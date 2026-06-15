import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { newPlayerContext, createRoomAsHost, joinRoomAsPlayer, waitForRealtime } from './helpers';

const editorIncrementBtn = (cardName: string) =>
  new RegExp(`^${cardName}, hiện \\d+\\. Bấm để thêm`);

/**
 * Build a 6-player room (1 GM + 5 non-GM), configure a 5-card deck,
 * ready everyone up, and start the game. Returns all contexts + pages.
 * Waits for transition to clear (~13s) before resolving.
 */
async function setupGameInProgress(browser: import('@playwright/test').Browser): Promise<{
  hostPage: Page;
  playerPages: Page[];
  allCtxs: BrowserContext[];
}> {
  const players = ['GM', 'P1', 'P2', 'P3', 'P4', 'P5'];
  const allCtxs: BrowserContext[] = [];
  const allPages: Page[] = [];

  const { context: hostCtx, page: hostPage } = await newPlayerContext(browser, { displayName: players[0] });
  allCtxs.push(hostCtx);
  allPages.push(hostPage);
  const code = await createRoomAsHost(hostPage, { name: players[0] });

  for (let i = 1; i < players.length; i++) {
    const { context, page } = await newPlayerContext(browser, { displayName: players[i] });
    allCtxs.push(context);
    allPages.push(page);
    await joinRoomAsPlayer(page, code, { name: players[i] });
  }

  await waitForRealtime(hostPage, 2_500);

  // Configure deck: 1 wolf + 4 villagers (5 cards for 5 non-GM)
  await hostPage.getByRole('button', { name: /Sửa bộ bài/i }).click();
  await waitForRealtime(hostPage, 500);
  await hostPage.getByRole('button', { name: editorIncrementBtn('Sói Thường') }).click();
  await waitForRealtime(hostPage, 150);
  for (let i = 0; i < 4; i++) {
    await hostPage.getByRole('button', { name: editorIncrementBtn('Dân Làng') }).click();
    await waitForRealtime(hostPage, 150);
  }
  await hostPage.getByRole('button', { name: /Quay lại lobby/i }).click();
  await waitForRealtime(hostPage, 800);

  // Ready up all non-GM players
  const playerPages = allPages.slice(1);
  for (const page of playerPages) {
    await page.getByRole('button', { name: /Tôi đã sẵn sàng/i }).click();
    await waitForRealtime(page, 200);
  }
  await waitForRealtime(hostPage, 2_000);

  // Start game
  const startBtn = hostPage.getByRole('button', { name: /^Bắt đầu chia bài$/ });
  await expect(startBtn).toBeEnabled({ timeout: 8_000 });
  await startBtn.click();

  // Wait for transition to clear (~13s)
  await waitForRealtime(hostPage, 13_000);

  return { hostPage, playerPages, allCtxs };
}

test.describe('G. GM mode tests', () => {
  test('G4: GM advances turn, all clients update in sync', async ({ browser }) => {
    // 6 contexts + transition wait → generous timeout
    test.setTimeout(120_000);

    const { hostPage, playerPages, allCtxs } = await setupGameInProgress(browser);

    try {
      // ── 1. All screens start at "Đêm ngày 1" ────────────────────────────────
      await expect(
        hostPage.getByRole('button', { name: /Kết thúc đêm/i }),
      ).toBeVisible({ timeout: 8_000 });
      // GM sees large "ĐÊM" label
      await expect(hostPage.getByText('ĐÊM', { exact: true })).toBeVisible({ timeout: 5_000 });

      for (const page of playerPages) {
        await expect(page.getByText(/Đêm ngày 1/i)).toBeVisible({ timeout: 8_000 });
      }

      // ── 2. GM advances: night → day ──────────────────────────────────────────
      await hostPage.getByRole('button', { name: /Kết thúc đêm/i }).click();
      await waitForRealtime(hostPage, 600);

      await expect(
        hostPage.getByRole('button', { name: /Kết thúc ngày/i }),
      ).toBeVisible({ timeout: 5_000 });
      await expect(hostPage.getByText('SÁNG', { exact: true })).toBeVisible({ timeout: 5_000 });

      for (const page of playerPages) {
        await expect(page.getByText(/Sáng ngày 1/i)).toBeVisible({ timeout: 5_000 });
      }

      // ── 3. GM advances: day → night (day 2) ─────────────────────────────────
      await hostPage.getByRole('button', { name: /Kết thúc ngày/i }).click();
      await waitForRealtime(hostPage, 600);

      await expect(
        hostPage.getByRole('button', { name: /Kết thúc đêm/i }),
      ).toBeVisible({ timeout: 5_000 });
      await expect(hostPage.getByText('Ngày 2')).toBeVisible({ timeout: 5_000 });

      for (const page of playerPages) {
        await expect(page.getByText(/Đêm ngày 2/i)).toBeVisible({ timeout: 5_000 });
      }

      // ── 4. GM ends game → back to lobby, no turn indicator ──────────────────
      await hostPage.getByRole('button', { name: /Kết thúc trận/i }).click();
      await waitForRealtime(hostPage, 2_500);

      // Should be back in lobby (player list visible, no turn indicators)
      await expect(hostPage.getByText('GM', { exact: false })).toBeVisible({ timeout: 8_000 });
      await expect(hostPage.getByText('ĐÊM', { exact: true })).not.toBeVisible();
      await expect(hostPage.getByText('SÁNG', { exact: true })).not.toBeVisible();
    } finally {
      for (const ctx of allCtxs) await ctx.close();
    }
  });
});
