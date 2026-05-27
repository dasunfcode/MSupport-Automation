import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { getOtpFromEmail } from '../utils/emailOtpReader';
import dotenv from 'dotenv';

dotenv.config();

test('MSUP-AUTH-TC001_user should login successfully using email OTP', async ({ page }) => {
  test.setTimeout(90000);

  const loginPage = new LoginPage(page);

  await loginPage.goto(process.env.BASE_URL || '');
  await loginPage.verifyTitle();
  

  await loginPage.login(
    process.env.EMAIL || '',
    process.env.PASSWORD || ''
  );

  // const otp = await getOtpFromEmail();
  // await loginPage.enterOtp(otp.toString());

  await loginPage.verifyDashboard();

  await page.context().storageState({
    path: process.env.AUTH_JSON_PATH || '',
  });
});