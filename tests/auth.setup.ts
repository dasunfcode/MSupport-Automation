import { test, expect } from '@playwright/test';
import { getOtpFromEmail } from '../utils/emailOtpReader';

test('user should login successfully using email OTP', async ({ page }) => {
  test.setTimeout(90000);

  await page.goto('https://qa.msupport.mone.am/login', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  await expect(page).toHaveTitle('MSupport');

  await page.fill('input[name="email"]', 'dasuntest5@gmail.com');
  await page.fill('input[name="password"]', 'Ddh@sivalicc*99');

  await page.getByRole('button', { name: 'Login' }).click();

  const otpInput = page.locator('input[data-input-otp="true"]');
  await expect(otpInput).toBeVisible({ timeout: 30000 });

  await page.waitForTimeout(3000);
  const otp = await getOtpFromEmail();

  await otpInput.focus();
  await page.keyboard.type(otp.toString());

  await expect(page).toHaveURL(/dashboard\/organizations/);
});
