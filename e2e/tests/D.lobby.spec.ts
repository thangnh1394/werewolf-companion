import { test, expect } from '@playwright/test';
import { newPlayerContext, createRoomAsHost, joinRoomAsPlayer, waitForRealtime } from './helpers';

test.describe('D. Lobby (multi-device)', () => {
  test('D1+D2: Host creates room, 2 players join, all see each other', async ({ browser }) => {
    const { context: hostCtx, page: hostPage } = await newPlayerContext(browser, {
      displayName: 'Alice',
      avatarId: 'wolf',
    });
    const code = await createRoomAsHost(hostPage, { name: 'Alice', avatarId: 'wolf' });

    await expect(hostPage.getByText(new RegExp(code))).toBeVisible();
    await expect(hostPage.getByText('Alice', { exact: false })).toBeVisible();

    const { context: bobCtx, page: bobPage } = await newPlayerContext(browser, {
      displayName: 'Bob',
      avatarId: 'fox',
    });
    await joinRoomAsPlayer(bobPage, code, { name: 'Bob', avatarId: 'fox' });

    const { context: charlieCtx, page: charliePage } = await newPlayerContext(browser, {
      displayName: 'Charlie',
      avatarId: 'owl',
    });
    await joinRoomAsPlayer(charliePage, code, { name: 'Charlie', avatarId: 'owl' });

    await waitForRealtime(hostPage, 1500);

    for (const page of [hostPage, bobPage, charliePage]) {
      await expect(page.getByText('Alice', { exact: false })).toBeVisible();
      await expect(page.getByText('Bob', { exact: false })).toBeVisible();
      await expect(page.getByText('Charlie', { exact: false })).toBeVisible();
    }

    await hostPage.screenshot({ path: 'screenshots/D1_lobby_3_players_host.png' });

    await hostCtx.close();
    await bobCtx.close();
    await charlieCtx.close();
  });

  test('D3: QR expand dialog opens with large QR + spaced code', async ({ browser }) => {
    const { context, page } = await newPlayerContext(browser, {
      displayName: 'QR_Test',
      avatarId: 'wolf',
    });
    const code = await createRoomAsHost(page, { name: 'QR_Test', avatarId: 'wolf' });

    await page.getByRole('button', { name: /Phóng to mã QR/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /Quét để vào phòng/i })).toBeVisible();

    // Scope to dialog to avoid header "Phòng XXX XXX" collision
    const codeFormatted = `${code.slice(0, 3)} ${code.slice(3)}`;
    await expect(dialog.getByText(codeFormatted, { exact: true })).toBeVisible();

    await page.screenshot({ path: 'screenshots/D3_qr_expanded.png' });
    await context.close();
  });

  test('D4: Room desk editor flow with correct aria labels', async ({ browser }) => {
    const { context, page } = await newPlayerContext(browser, {
      displayName: 'Deck_Test',
      avatarId: 'wolf',
    });
    await createRoomAsHost(page, { name: 'Deck_Test', avatarId: 'wolf' });

    // Real aria-label is "Sửa bộ bài", not just "Sửa"
    await page.getByRole('button', { name: /Sửa bộ bài/i }).click();
    await waitForRealtime(page, 500);

    await expect(page.getByRole('heading', { name: /Sửa bộ bài/i })).toBeVisible();

    // Real aria-label: "Sói Thường, hiện 0. Bấm để thêm, giữ để bớt."
    // Use ", hiện " substring to distinguish from preview chip "Sói Thường, 1 thẻ."
    const wolfBtn = page.getByRole('button', { name: /^Sói Thường, hiện \d+\. Bấm để thêm/ });
    await wolfBtn.click();
    await waitForRealtime(page, 200);

    // Close via back button — aria-label "Quay lại lobby"
    await page.getByRole('button', { name: /Quay lại lobby/i }).click();
    await waitForRealtime(page, 500);

    // Preview chip text visible
    await expect(page.getByText(/Bộ bài đêm nay/i)).toBeVisible();

    await page.screenshot({ path: 'screenshots/D4_room_desk_thumbnails.png' });
    await context.close();
  });

  test('D5: Ready toggle propagates to all clients', async ({ browser }) => {
    const { context: hostCtx, page: hostPage } = await newPlayerContext(browser, {
      displayName: 'Alice',
      avatarId: 'wolf',
    });
    const code = await createRoomAsHost(hostPage, { name: 'Alice', avatarId: 'wolf' });

    const { context: bobCtx, page: bobPage } = await newPlayerContext(browser, {
      displayName: 'Bob',
      avatarId: 'fox',
    });
    await joinRoomAsPlayer(bobPage, code, { name: 'Bob', avatarId: 'fox' });

    await waitForRealtime(hostPage, 1000);

    const readyBtn = bobPage.getByRole('button', { name: /Tôi đã sẵn sàng/i });
    await readyBtn.click();
    await waitForRealtime(bobPage, 800);

    await expect(bobPage.getByRole('button', { name: /Bỏ sẵn sàng/i })).toBeVisible();

    // Host should see 2 ready badges (host + Bob)
    await expect(hostPage.getByText('Sẵn sàng', { exact: true })).toHaveCount(2, { timeout: 3000 });

    await hostCtx.close();
    await bobCtx.close();
  });
});
