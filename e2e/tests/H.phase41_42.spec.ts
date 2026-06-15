import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { newPlayerContext, createRoomAsHost, joinRoomAsPlayer, waitForRealtime } from './helpers';

const editorIncrementBtn = (cardName: string) =>
  new RegExp(`^${cardName}, hiện \\d+\\. Bấm để thêm`);

/**
 * Build 6-player lobby (1 GM + 5 players), configure a 5-card deck,
 * ready up all non-GM players. Does NOT start the game.
 */
async function setupReadyLobby(browser: import('@playwright/test').Browser): Promise<{
  hostPage: Page;
  playerPages: Page[];
  allCtxs: BrowserContext[];
  code: string;
}> {
  const names = ['GM', 'P1', 'P2', 'P3', 'P4', 'P5'];
  const allCtxs: BrowserContext[] = [];
  const allPages: Page[] = [];

  const { context: hostCtx, page: hostPage } = await newPlayerContext(browser, { displayName: names[0] });
  allCtxs.push(hostCtx);
  allPages.push(hostPage);
  const code = await createRoomAsHost(hostPage, { name: names[0] });

  for (let i = 1; i < names.length; i++) {
    const { context, page } = await newPlayerContext(browser, { displayName: names[i] });
    allCtxs.push(context);
    allPages.push(page);
    await joinRoomAsPlayer(page, code, { name: names[i] });
  }

  await waitForRealtime(hostPage, 2_500);

  // Configure deck: 1 wolf + 4 villagers = 5 cards for 5 non-GM players
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

  const playerPages = allPages.slice(1);
  for (const page of playerPages) {
    await page.getByRole('button', { name: /Tôi đã sẵn sàng/i }).click();
    await waitForRealtime(page, 200);
  }
  await waitForRealtime(hostPage, 2_000);

  return { hostPage, playerPages, allCtxs, code };
}

/**
 * Same as setupReadyLobby but starts the game and waits for transition to clear.
 */
async function setupGameInProgress(browser: import('@playwright/test').Browser): Promise<{
  hostPage: Page;
  playerPages: Page[];
  allCtxs: BrowserContext[];
  code: string;
}> {
  const setup = await setupReadyLobby(browser);
  const { hostPage } = setup;

  const startBtn = hostPage.getByRole('button', { name: /^Bắt đầu chia bài$/ });
  await expect(startBtn).toBeEnabled({ timeout: 8_000 });
  await startBtn.click();

  await waitForRealtime(hostPage, 13_000);

  return setup;
}

// ─── Phase 4.1 — GM role ─────────────────────────────────────────────────────

test.describe('H. Phase 4.1 — GM role in lobby', () => {
  test('H1: GM badge visible for host, GM has no ready button', async ({ browser }) => {
    const { context: aliceCtx, page: alicePage } = await newPlayerContext(browser, {
      displayName: 'Alice',
    });
    const code = await createRoomAsHost(alicePage, { name: 'Alice' });

    const { context: bobCtx, page: bobPage } = await newPlayerContext(browser, {
      displayName: 'Bob',
    });
    await joinRoomAsPlayer(bobPage, code, { name: 'Bob' });
    await waitForRealtime(alicePage, 1_500);

    // GM (Alice) has "Quản trò" badge visible on all screens
    await expect(alicePage.getByText('Quản trò', { exact: true })).toBeVisible();
    await expect(bobPage.getByText('Quản trò', { exact: true })).toBeVisible();

    // GM has no ready button — they never need to ready up
    await expect(alicePage.getByRole('button', { name: /Tôi đã sẵn sàng/i })).toHaveCount(0);

    // Non-GM (Bob) has a ready button
    await expect(bobPage.getByRole('button', { name: /Tôi đã sẵn sàng/i })).toBeVisible();

    await alicePage.screenshot({ path: 'screenshots/H1_gm_badge_in_lobby.png' });

    await aliceCtx.close();
    await bobCtx.close();
  });

  test('H2: Wrong deck size shows hint text + error toast, correct deck clears warning', async ({ browser }) => {
    test.setTimeout(90_000);

    const names = ['GM', 'P1', 'P2', 'P3', 'P4', 'P5'];
    const allCtxs: BrowserContext[] = [];
    const allPages: Page[] = [];

    const { context: hostCtx, page: hostPage } = await newPlayerContext(browser, { displayName: names[0] });
    allCtxs.push(hostCtx);
    allPages.push(hostPage);
    const code = await createRoomAsHost(hostPage, { name: names[0] });

    for (let i = 1; i < names.length; i++) {
      const { context, page } = await newPlayerContext(browser, { displayName: names[i] });
      allCtxs.push(context);
      allPages.push(page);
      await joinRoomAsPlayer(page, code, { name: names[i] });
    }
    await waitForRealtime(hostPage, 2_000);

    // All 5 non-GMs ready up
    for (const page of allPages.slice(1)) {
      await page.getByRole('button', { name: /Tôi đã sẵn sàng/i }).click();
      await waitForRealtime(page, 200);
    }
    await waitForRealtime(hostPage, 1_500);

    // Button is enabled (all ready, enough players) but deck is empty (0 of 5 needed).
    // The UI shows a hint, and clicking fires a toast rather than disabling the button.
    const startBtn = hostPage.getByRole('button', { name: /^Bắt đầu chia bài$/ });
    await expect(startBtn).toBeEnabled({ timeout: 3_000 });

    // Hint text tells GM how many cards are needed
    await expect(hostPage.getByText(/Cần đúng 5 thẻ trong bộ bài/i)).toBeVisible();

    // Clicking with wrong deck shows error toast
    await startBtn.click();
    await expect(hostPage.getByText(/Số thẻ không khớp/i)).toBeVisible({ timeout: 3_000 });
    await waitForRealtime(hostPage, 800); // let toast dismiss

    // Configure 4 cards (still one short)
    await hostPage.getByRole('button', { name: /Sửa bộ bài/i }).click();
    await waitForRealtime(hostPage, 500);
    for (let i = 0; i < 4; i++) {
      await hostPage.getByRole('button', { name: editorIncrementBtn('Dân Làng') }).click();
      await waitForRealtime(hostPage, 150);
    }
    await hostPage.getByRole('button', { name: /Quay lại lobby/i }).click();
    await waitForRealtime(hostPage, 800);

    // Hint still present, toast still fires
    await expect(hostPage.getByText(/Cần đúng 5 thẻ trong bộ bài/i)).toBeVisible();
    await startBtn.click();
    await expect(hostPage.getByText(/Số thẻ không khớp/i)).toBeVisible({ timeout: 3_000 });
    await waitForRealtime(hostPage, 800);

    // Add the 5th card (deck now matches non-GM count)
    await hostPage.getByRole('button', { name: /Sửa bộ bài/i }).click();
    await waitForRealtime(hostPage, 500);
    await hostPage.getByRole('button', { name: editorIncrementBtn('Dân Làng') }).click();
    await waitForRealtime(hostPage, 150);
    await hostPage.getByRole('button', { name: /Quay lại lobby/i }).click();
    await waitForRealtime(hostPage, 800);

    // Hint text gone — deck matches
    await expect(hostPage.getByText(/Cần đúng 5 thẻ trong bộ bài/i)).not.toBeVisible();

    await hostPage.screenshot({ path: 'screenshots/H2_correct_deck_no_hint.png' });

    for (const ctx of allCtxs) await ctx.close();
  });

  test('H3: GM transfer — new GM gets start button, old GM gets ready button', async ({ browser }) => {
    test.setTimeout(60_000);

    const { context: aliceCtx, page: alicePage } = await newPlayerContext(browser, {
      displayName: 'Alice',
    });
    const code = await createRoomAsHost(alicePage, { name: 'Alice' });

    const { context: bobCtx, page: bobPage } = await newPlayerContext(browser, {
      displayName: 'Bob',
    });
    await joinRoomAsPlayer(bobPage, code, { name: 'Bob' });
    await waitForRealtime(alicePage, 1_500);

    // GM (Alice) sees transfer button on Bob's row
    const transferBtn = alicePage.getByRole('button', {
      name: /Trao quyền quản trò cho Bob/i,
    });
    await expect(transferBtn).toBeVisible({ timeout: 3_000 });

    // Click → confirm dialog appears
    await transferBtn.click();
    const dialog = alicePage.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3_000 });
    await expect(dialog.getByText(/Trao quyền cho Bob/i)).toBeVisible();

    // Confirm transfer
    await dialog.getByRole('button', { name: /Trao cho Bob/i }).click();
    await waitForRealtime(alicePage, 1_500);

    // Bob now has "Quản trò" badge on both screens
    await expect(alicePage.getByText('Quản trò', { exact: true })).toBeVisible({ timeout: 5_000 });
    await expect(bobPage.getByText('Quản trò', { exact: true })).toBeVisible({ timeout: 5_000 });

    // Alice (old GM) now has a ready button
    await expect(alicePage.getByRole('button', { name: /Tôi đã sẵn sàng/i })).toBeVisible({ timeout: 3_000 });

    // Bob (new GM) has no ready button
    await expect(bobPage.getByRole('button', { name: /Tôi đã sẵn sàng/i })).toHaveCount(0);

    await alicePage.screenshot({ path: 'screenshots/H3_gm_transferred_to_bob.png' });

    await aliceCtx.close();
    await bobCtx.close();
  });
});

// ─── Phase 4.2 — Turn tracking ───────────────────────────────────────────────

test.describe('H. Phase 4.2 — Turn tracking', () => {
  test('H4: Non-GM players see compact turn indicator but no advance button', async ({ browser }) => {
    test.setTimeout(120_000);

    const { hostPage, playerPages, allCtxs } = await setupGameInProgress(browser);

    try {
      // GM sees the large indicator and advance button
      await expect(
        hostPage.getByRole('button', { name: /Kết thúc đêm/i }),
      ).toBeVisible({ timeout: 8_000 });
      await expect(hostPage.getByText('ĐÊM', { exact: true })).toBeVisible({ timeout: 5_000 });

      // Each non-GM player sees compact pill text, not the advance button
      for (const page of playerPages) {
        await expect(page.getByText(/Đêm ngày 1/i)).toBeVisible({ timeout: 8_000 });
        await expect(
          page.getByRole('button', { name: /Kết thúc đêm/i }),
        ).toHaveCount(0);
        await expect(
          page.getByRole('button', { name: /Kết thúc ngày/i }),
        ).toHaveCount(0);
      }

      await hostPage.screenshot({ path: 'screenshots/H4_gm_large_indicator.png' });
      await playerPages[0].screenshot({ path: 'screenshots/H4_player_compact_indicator.png' });
    } finally {
      for (const ctx of allCtxs) await ctx.close();
    }
  });

  test('H5: Re-deal after game ends resets turn to Đêm ngày 1', async ({ browser }) => {
    test.setTimeout(210_000);

    const { hostPage, playerPages, allCtxs } = await setupGameInProgress(browser);

    try {
      // ── Game 1: advance to Sáng ngày 1, then end ────────────────────────────
      await expect(
        hostPage.getByRole('button', { name: /Kết thúc đêm/i }),
      ).toBeVisible({ timeout: 8_000 });

      await hostPage.getByRole('button', { name: /Kết thúc đêm/i }).click();
      await waitForRealtime(hostPage, 600);

      // Verify we're at day 1 (Sáng)
      await expect(
        hostPage.getByRole('button', { name: /Kết thúc ngày/i }),
      ).toBeVisible({ timeout: 5_000 });

      // End game from Sáng ngày 1
      await hostPage.getByRole('button', { name: /Kết thúc trận/i }).click();
      await waitForRealtime(hostPage, 2_500);

      // Verify back in lobby (turn indicators gone)
      await expect(hostPage.getByText('ĐÊM', { exact: true })).not.toBeVisible();
      await expect(hostPage.getByText('SÁNG', { exact: true })).not.toBeVisible();

      // ── Game 2: re-deal, verify turn starts fresh at Đêm ngày 1 ────────────
      for (const page of playerPages) {
        const readyBtn = page.getByRole('button', { name: /Tôi đã sẵn sàng/i });
        if (await readyBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await readyBtn.click();
          await waitForRealtime(page, 200);
        }
      }
      await waitForRealtime(hostPage, 2_000);

      const startBtn = hostPage.getByRole('button', { name: /^Bắt đầu chia bài$/ });
      await expect(startBtn).toBeEnabled({ timeout: 5_000 });
      await startBtn.click();

      // Wait for 2nd transition to clear
      await waitForRealtime(hostPage, 13_000);

      // Turn resets — GM should see Đêm (night 1), not the "Kết thúc ngày" from game 1
      await expect(
        hostPage.getByRole('button', { name: /Kết thúc đêm/i }),
      ).toBeVisible({ timeout: 8_000 });
      await expect(hostPage.getByText('ĐÊM', { exact: true })).toBeVisible({ timeout: 5_000 });

      // Non-GMs see Đêm ngày 1 (not Sáng from previous game)
      for (const page of playerPages) {
        await expect(page.getByText(/Đêm ngày 1/i)).toBeVisible({ timeout: 8_000 });
      }

      await hostPage.screenshot({ path: 'screenshots/H5_redeal_resets_to_night1.png' });
    } finally {
      for (const ctx of allCtxs) await ctx.close();
    }
  });
});
