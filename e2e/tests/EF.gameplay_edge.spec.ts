import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { newPlayerContext, createRoomAsHost, joinRoomAsPlayer, waitForRealtime } from './helpers';

/**
 * MIN_PLAYERS from packages/shared/src/constants.ts is 6 — the "Bắt đầu chia bài"
 * button is disabled until 6 players are in the lobby (1 GM + 5 non-GM).
 */
const MIN_PLAYERS = 6;

/**
 * The deck editor is a z-40 overlay that does NOT hide the lobby DOM beneath it.
 * After adding a card, the lobby's RoomDeskPreview renders a chip button with
 * aria-label like "Dân Làng, 1 thẻ. Bấm để xem chi tiết." — colliding with the
 * editor's increment button "Dân Làng, hiện 1. Bấm để thêm, giữ để bớt." under
 * strict-mode matching.
 *
 * Solution: use the unique " hiện " (editor) vs " N thẻ" (preview) substrings.
 */
const editorIncrementBtn = (cardName: string) =>
  new RegExp(`^${cardName}, hiện \\d+\\. Bấm để thêm`);

const PLAYER_SEED = [
  { name: 'Alice',   avatarId: 'wolf' },
  { name: 'Bob',     avatarId: 'fox' },
  { name: 'Charlie', avatarId: 'owl' },
  { name: 'Diana',   avatarId: 'cat' },
  { name: 'Eve',     avatarId: 'bear' },
  { name: 'Frank',   avatarId: 'wolf' },
];

async function setupLobby(browser: import('@playwright/test').Browser, count: number) {
  if (count < 1) throw new Error('Need at least 1 player');

  const ctxs: { ctx: BrowserContext; page: Page; name: string }[] = [];

  const seed0 = PLAYER_SEED[0];
  const { context: hostCtx, page: hostPage } = await newPlayerContext(browser, {
    displayName: seed0.name,
    avatarId: seed0.avatarId,
  });
  const code = await createRoomAsHost(hostPage, { name: seed0.name, avatarId: seed0.avatarId });
  ctxs.push({ ctx: hostCtx, page: hostPage, name: seed0.name });

  for (let i = 1; i < count; i++) {
    const seed = PLAYER_SEED[i] ?? { name: `Player${i}`, avatarId: 'wolf' };
    const { context, page } = await newPlayerContext(browser, {
      displayName: seed.name,
      avatarId: seed.avatarId,
    });
    await joinRoomAsPlayer(page, code, { name: seed.name, avatarId: seed.avatarId });
    ctxs.push({ ctx: context, page, name: seed.name });
  }

  await waitForRealtime(hostPage, 1500);
  return { code, ctxs, hostPage };
}

test.describe('E. Gameplay loop', () => {
  test('E1-E5: Full game flow with 6 players (lobby → start → reveal → end)', async ({ browser }) => {
    test.setTimeout(180_000);

    const { ctxs, hostPage } = await setupLobby(browser, MIN_PLAYERS);
    const allPages = ctxs.map(c => c.page);
    const nonHostPages = allPages.slice(1);

    // Open editor
    await hostPage.getByRole('button', { name: /Sửa bộ bài/i }).click();
    await waitForRealtime(hostPage, 500);

    // Add 1 wolf + 4 villagers
    await hostPage.getByRole('button', { name: editorIncrementBtn('Sói Thường') }).click();
    await waitForRealtime(hostPage, 200);

    for (let i = 0; i < 4; i++) {
      await hostPage.getByRole('button', { name: editorIncrementBtn('Dân Làng') }).click();
      await waitForRealtime(hostPage, 150);
    }
    await waitForRealtime(hostPage, 500);

    // Close editor
    await hostPage.getByRole('button', { name: /Quay lại lobby/i }).click();
    await waitForRealtime(hostPage, 800);

    // Non-hosts ready up
    for (const page of nonHostPages) {
      await page.getByRole('button', { name: /Tôi đã sẵn sàng/i }).click();
      await waitForRealtime(page, 300);
    }
    await waitForRealtime(hostPage, 1500);

    // Start game
    const startBtn = hostPage.getByRole('button', { name: /^Bắt đầu chia bài$/ });
    await expect(startBtn).toBeEnabled({ timeout: 5000 });
    await startBtn.click();

    // E1: Transition video appears on all 6
    for (const page of allPages) {
      await expect(page.locator('video').first()).toBeVisible({ timeout: 5000 });
    }
    await hostPage.screenshot({ path: 'screenshots/E1_transition_playing.png' });

    // Wait for transition to finish (~8s video + 0.4s fade)
    await waitForRealtime(hostPage, 10_000);

    // E2: GM sees placeholder; non-GM players see card UI
    await expect(hostPage.getByText(/Bạn là quản trò/i)).toBeVisible({ timeout: 6000 });
    for (const page of nonHostPages) {
      await expect(page.getByText(/VAI CỦA BẠN|Giữ vào card|Đang nhận bài/i).first())
        .toBeVisible({ timeout: 6000 });
    }
    await hostPage.screenshot({ path: 'screenshots/E2_card_face_down.png' });

    // E2b: Bob tap-and-hold reveal
    const bobPage = nonHostPages[0];
    const card = bobPage.getByRole('button', { name: /Giữ để xem vai|Vai của bạn/i }).first();
    if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
      const box = await card.boundingBox();
      if (box) {
        await bobPage.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await bobPage.mouse.down();
        await waitForRealtime(bobPage, 1200);
        await bobPage.screenshot({ path: 'screenshots/E2b_card_revealed.png' });
        await bobPage.mouse.up();
      }
    }

    // E6: Non-host has no end-game button
    for (const page of nonHostPages) {
      await expect(page.getByRole('button', { name: /Kết thúc trận/i })).toHaveCount(0);
    }

    // E5: Host ends game
    const endBtn = hostPage.getByRole('button', { name: /Kết thúc trận/i });
    await expect(endBtn).toBeVisible();
    await endBtn.click();

    // All return to lobby
    await waitForRealtime(hostPage, 2000);
    for (const page of allPages) {
      await expect(page.getByText(/(Sẵn sàng|Đang nghĩ)/).first()).toBeVisible({ timeout: 5000 });
    }
    await hostPage.screenshot({ path: 'screenshots/E5_back_to_lobby.png' });

    for (const { ctx } of ctxs) await ctx.close();
  });

  test('E3: Privacy — no card info in broadcasted WebSocket frames', async ({ browser }) => {
    test.setTimeout(120_000);

    const wsMessages: { received: any[]; sent: any[] } = { received: [], sent: [] };

    const captureWs = (page: Page) => {
      page.on('websocket', (ws) => {
        ws.on('framereceived', (evt) => {
          try {
            const data = typeof evt.payload === 'string' ? evt.payload : evt.payload.toString();
            wsMessages.received.push(JSON.parse(data));
          } catch { /* binary */ }
        });
        ws.on('framesent', (evt) => {
          try {
            const data = typeof evt.payload === 'string' ? evt.payload : evt.payload.toString();
            wsMessages.sent.push(JSON.parse(data));
          } catch { /* binary */ }
        });
      });
    };

    const seed0 = PLAYER_SEED[0];
    const { context: hostCtx, page: hostPage } = await newPlayerContext(browser, {
      displayName: seed0.name,
      avatarId: seed0.avatarId,
    });
    captureWs(hostPage);
    const code = await createRoomAsHost(hostPage, { name: seed0.name, avatarId: seed0.avatarId });

    const otherCtxs: BrowserContext[] = [];
    for (let i = 1; i < MIN_PLAYERS; i++) {
      const seed = PLAYER_SEED[i];
      const { context, page } = await newPlayerContext(browser, {
        displayName: seed.name,
        avatarId: seed.avatarId,
      });
      await joinRoomAsPlayer(page, code, { name: seed.name, avatarId: seed.avatarId });
      otherCtxs.push(context);

      await waitForRealtime(page, 300);
      await page.getByRole('button', { name: /Tôi đã sẵn sàng/i }).click();
    }
    await waitForRealtime(hostPage, 2000);

    // Deck setup
    await hostPage.getByRole('button', { name: /Sửa bộ bài/i }).click();
    await waitForRealtime(hostPage, 500);
    await hostPage.getByRole('button', { name: editorIncrementBtn('Sói Thường') }).click();
    await waitForRealtime(hostPage, 200);
    for (let i = 0; i < 4; i++) {
      await hostPage.getByRole('button', { name: editorIncrementBtn('Dân Làng') }).click();
      await waitForRealtime(hostPage, 150);
    }
    await hostPage.getByRole('button', { name: /Quay lại lobby/i }).click();
    await waitForRealtime(hostPage, 1000);

    // Clear WS log, then start
    wsMessages.received = [];
    wsMessages.sent = [];

    await hostPage.getByRole('button', { name: /^Bắt đầu chia bài$/ }).click();
    await waitForRealtime(hostPage, 4000);

    // Audit GAME_STARTED
    const gameStarted = wsMessages.received.filter(m => m.type === 'GAME_STARTED');
    expect(gameStarted.length, 'expected ≥1 GAME_STARTED').toBeGreaterThan(0);
    for (const msg of gameStarted) {
      expect(msg, 'GAME_STARTED has cardId').not.toHaveProperty('cardId');
      expect(msg, 'GAME_STARTED has assignments').not.toHaveProperty('assignments');
      expect(msg, 'GAME_STARTED has yourCard').not.toHaveProperty('yourCard');
      const keys = Object.keys(msg);
      expect(keys.length, `GAME_STARTED keys: ${keys.join(',')}`).toBeLessThanOrEqual(2);
    }

    // GM has no card — no YOUR_CARD should arrive on the host connection
    const yourCard = wsMessages.received.filter(m => m.type === 'YOUR_CARD');
    expect(yourCard.length, 'GM receives no YOUR_CARD').toBe(0);

    console.log('✓ Privacy audit. GAME_STARTED:', gameStarted.length, 'YOUR_CARD (GM, expect 0):', yourCard.length);

    await hostCtx.close();
    for (const ctx of otherCtxs) await ctx.close();
  });
});

test.describe('F. Edge cases', () => {
  test('F1: Refresh during lobby reconnects with same state', async ({ browser }) => {
    const { context, page } = await newPlayerContext(browser, {
      displayName: 'Refresher',
      avatarId: 'wolf',
    });
    const code = await createRoomAsHost(page, { name: 'Refresher', avatarId: 'wolf' });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await waitForRealtime(page, 1500);

    await expect(page).toHaveURL(new RegExp(`/lobby/${code}`));
    await expect(page.getByText('Refresher', { exact: false })).toBeVisible();

    await context.close();
  });

  test('F3: Player leaves room', async ({ browser }) => {
    const { context: hostCtx, page: hostPage } = await newPlayerContext(browser, {
      displayName: 'Stayer',
    });
    const code = await createRoomAsHost(hostPage, { name: 'Stayer', avatarId: 'wolf' });

    const { context: bobCtx, page: bobPage } = await newPlayerContext(browser, {
      displayName: 'Leaver',
    });
    await joinRoomAsPlayer(bobPage, code, { name: 'Leaver', avatarId: 'fox' });
    await waitForRealtime(hostPage, 1000);

    await bobPage.getByRole('button', { name: 'Rời phòng' }).click();
    await waitForRealtime(hostPage, 1500);

    await expect(hostPage.getByText('Leaver', { exact: false })).toHaveCount(0);
    await expect(bobPage).toHaveURL(/\/$/);

    await hostCtx.close();
    await bobCtx.close();
  });

  test('F4: Host leaves → other player sees room closed', async ({ browser }) => {
    const { context: hostCtx, page: hostPage } = await newPlayerContext(browser, {
      displayName: 'HostLeaver',
    });
    const code = await createRoomAsHost(hostPage, { name: 'HostLeaver', avatarId: 'wolf' });

    const { context: playerCtx, page: playerPage } = await newPlayerContext(browser, {
      displayName: 'Orphan',
    });
    await joinRoomAsPlayer(playerPage, code, { name: 'Orphan', avatarId: 'fox' });
    await waitForRealtime(hostPage, 1000);

    await hostPage.getByRole('button', { name: 'Rời phòng' }).click();
    await waitForRealtime(playerPage, 3000);

    await expect(playerPage.getByRole('heading', { name: /Phòng đã đóng/i }))
      .toBeVisible({ timeout: 15_000 });

    await playerPage.screenshot({ path: 'screenshots/F4_room_closed.png' });

    await hostCtx.close();
    await playerCtx.close();
  });
});
