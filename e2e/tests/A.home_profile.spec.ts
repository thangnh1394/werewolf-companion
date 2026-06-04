import { test, expect } from '@playwright/test';
import { newPlayerContext, waitForRealtime, createRoomAsHost } from './helpers';

test.describe('A. Home + Profile', () => {
  test('A1: First-visit home shows branding, NO profile icon', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
    });
    const page = await context.newPage();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Branding visible
    await expect(page.getByRole('heading', { name: /Sói Đêm/i })).toBeVisible();

    // Main CTAs
    await expect(page.getByRole('button', { name: /Tạo phòng mới/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Nhập code phòng/i })).toBeVisible();

    // No profile icon (no history)
    await expect(page.getByLabel(/Sửa hồ sơ/i)).toHaveCount(0);

    await page.screenshot({ path: 'screenshots/A1_home_no_history.png' });
    await context.close();
  });

  test('A2: Profile icon appears after history is set', async ({ browser }) => {
    const { context, page } = await newPlayerContext(browser, {
      displayName: 'Test_User',
      avatarId: 'wolf',
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Profile icon now visible because localStorage has name
    await expect(page.getByLabel(/Sửa hồ sơ/i)).toBeVisible();

    // "Chào, Test_User" chip visible
    await expect(page.getByText(/Chào.*Test_User/)).toBeVisible();

    await page.screenshot({ path: 'screenshots/A2_home_with_history.png' });
    await context.close();
  });

  test('A3: Profile dialog opens, allows avatar change, persists', async ({ browser }) => {
    const { context, page } = await newPlayerContext(browser, {
      displayName: 'Editor',
      avatarId: 'wolf',
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Open dialog
    await page.getByLabel(/Sửa hồ sơ/i).click();
    await waitForRealtime(page, 300);

    // Verify dialog open with current state
    await expect(page.getByRole('heading', { name: /Hồ sơ của bạn/i })).toBeVisible();

    // Avatar grid visible (3 categories)
    await expect(page.getByText(/NHÂN VẬT|nhân vật/i)).toBeVisible();
    await expect(page.getByText(/ĐỘNG VẬT|động vật/i)).toBeVisible();
    await expect(page.getByText(/KHÁC|khác/i)).toBeVisible();

    // Pick Ninja
    const ninja = page.getByLabel(/Chọn Ninja/i);
    await ninja.click();

    // Save button enabled (changed avatar)
    const saveBtn = page.getByRole('button', { name: /^Lưu$/i });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    // Dialog closed
    await expect(page.getByRole('heading', { name: /Hồ sơ của bạn/i })).toHaveCount(0);

    // Verify persisted in localStorage
    const savedAvatar = await page.evaluate(() => localStorage.getItem('wwc.avatarId'));
    expect(savedAvatar).toBe('ninja');

    await page.screenshot({ path: 'screenshots/A3_profile_after_save.png' });
    await context.close();
  });

  test('A4: Profile dialog fits in viewport (Save/Cancel always visible)', async ({ browser }) => {
    const { context, page } = await newPlayerContext(browser, {
      displayName: 'Viewport_Test',
      avatarId: 'wolf',
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/Sửa hồ sơ/i).click();
    await waitForRealtime(page, 300);

    // Save and Cancel buttons must be visible without scrolling
    const saveBtn = page.getByRole('button', { name: /^Lưu$/i });
    const cancelBtn = page.getByRole('button', { name: /^Hủy$/i });

    await expect(saveBtn).toBeInViewport();
    await expect(cancelBtn).toBeInViewport();

    await page.screenshot({ path: 'screenshots/A4_dialog_layout.png' });
    await context.close();
  });
});
