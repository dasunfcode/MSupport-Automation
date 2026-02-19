import { test, expect } from '@playwright/test';
import { getOtpFromEmail } from '../utils/emailOtpReader';
import dotenv from 'dotenv';

dotenv.config();

test('TC001_user should login successfully using email OTP', async ({ page }) => {
  test.setTimeout(90000);

  await page.goto(`${process.env.BASE_URL}/login`, {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  await expect(page).toHaveTitle('MSupport');

  await page.fill('input[name="email"]', process.env.EMAIL || '');
  await page.fill('input[name="password"]', process.env.PASSWORD || '');

  await page.getByRole('button', { name: 'Login' }).click();

  const otpInput = page.locator('input[data-input-otp="true"]');
  await expect(otpInput).toBeVisible({ timeout: 30000 });

  const otp = await getOtpFromEmail();
  await otpInput.focus();
  await page.keyboard.type(otp.toString());

  await expect(page).toHaveURL(/dashboard\/organizations/);

  await page.context().storageState({ path: process.env.AUTH_JSON_PATH || '' });
});