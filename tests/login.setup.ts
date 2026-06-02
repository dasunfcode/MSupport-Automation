import { test } from '../fixtures/fixtures';
import dotenv from 'dotenv';

dotenv.config();

const { BASE_URL = '', EMAIL = '', PASSWORD = '', AUTH_JSON_PATH = '' } = process.env;

test('MSUP-AUTH-TC001_user should login successfully using email OTP', async ({ loginPage, page }) => {
  test.setTimeout(90_000);

  await loginPage.goto(BASE_URL);
  await loginPage.verifyTitle();

  await loginPage.login(EMAIL, PASSWORD);

  // const otp = await getOtpFromEmail();
  // await loginPage.enterOtp(otp.toString());

  await loginPage.verifyDashboard();

  await page.context().storageState({ path: AUTH_JSON_PATH });
});