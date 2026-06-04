import { test, expect } from '@playwright/test';
import { newPlayerContext, randomCode } from './helpers';

test.describe('B. Create Room Form', () => {
  test('B1: Form prefills name + avatar from localStorage', async ({ browser }) => {
    const { context, page } = await newPlayerContext(browser, {
      displayName: 'Hoang',
      avatarId: 'fox',
    });

    await page.goto('/create');
    await page.waitForLoadState('networkidle');

    // Name input prefilled
    const nameInput = page.getByPlaceholder(/Ví dụ:|tên/i).first();
    await expect(nameInput).toHaveValue('Hoang');

    // Avatar button shows "Cáo" label (fox in Vietnamese)
    await expect(page.getByText('Cáo')).toBeVisible();

    await page.screenshot({ path: 'screenshots/B1_create_prefilled.png' });
    await context.close();
  });

  test('B2: Submit disabled until name + valid code', async ({ browser }) => {
    const { context, page } = await newPlayerContext(browser, {
      displayName: '',
    });

    await page.goto('/create');
    await page.waitForLoadState('networkidle');

    const submitBtn = page.getByRole('button', { name: /Tạo phòng/i });
    await expect(submitBtn).toBeDisabled();

    // Fill name only — still disabled (no code)
    await page.getByPlaceholder(/Ví dụ:|tên/i).first().fill('Test');
    await expect(submitBtn).toBeDisabled();

    // Fill code → enabled
    const codeInput = page.locator('input[inputmode="numeric"]').first();
    await codeInput.fill(randomCode());
    await expect(submitBtn).toBeEnabled();

    await context.close();
  });

  test('B3: Avatar picker dialog opens from form', async ({ browser }) => {
    const { context, page } = await newPlayerContext(browser, {
      displayName: 'Avatar_Test',
    });

    await page.goto('/create');
    await page.waitForLoadState('networkidle');

    // Click avatar selector button on form
    const avatarBtn = page.getByText(/Bấm để đổi ảnh/i);
    await avatarBtn.click();

    // Dialog opens
    await expect(page.getByRole('heading', { name: /Chọn ảnh đại diện/i })).toBeVisible();

    // Pick a different avatar
    await page.getByLabel(/Chọn Cú mèo/i).click();
    await page.getByRole('button', { name: /Xong/i }).click();

    // Form's avatar button now shows new avatar
    await expect(page.getByText('Cú mèo')).toBeVisible();

    await page.screenshot({ path: 'screenshots/B3_avatar_picker.png' });
    await context.close();
  });
});

test.describe('C. Join Room Form', () => {
  test('C1: Code prefills from URL ?code=', async ({ browser }) => {
    const { context, page } = await newPlayerContext(browser, {
      displayName: 'Joiner',
    });

    await page.goto('/join?code=123456');
    await page.waitForLoadState('networkidle');

    // Code input should have 123456
    const codeInput = page.locator('input[inputmode="numeric"]').first();
    await expect(codeInput).toHaveValue('123456');

    await context.close();
  });

  test('C2: Submit disabled with short code', async ({ browser }) => {
    const { context, page } = await newPlayerContext(browser, {
      displayName: 'Short_Code',
    });

    await page.goto('/join');
    await page.waitForLoadState('networkidle');

    const submitBtn = page.getByRole('button', { name: /Vào phòng/i });

    // Empty form → disabled
    await expect(submitBtn).toBeDisabled();

    // Fill 3-digit code (invalid)
    const codeInput = page.locator('input[inputmode="numeric"]').first();
    await codeInput.fill('123');
    await expect(submitBtn).toBeDisabled();

    // Fill 6-digit code (valid)
    await codeInput.fill('123456');
    await expect(submitBtn).toBeEnabled();

    await context.close();
  });
});
