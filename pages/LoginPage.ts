import { Page, Locator, expect } from '@playwright/test';

const GOTO_TIMEOUT = 60_000;
const OTP_TIMEOUT = 30_000;

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly otpInput: Locator;

  constructor(readonly page: Page) {
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.otpInput = page.locator('input[data-input-otp="true"]');
  }

  async goto(baseUrl: string) {
    await this.page.goto(`${baseUrl}/login`, {
      waitUntil: 'domcontentloaded',
      timeout: GOTO_TIMEOUT,
    });
  }

  async verifyTitle() {
    await expect(this.page).toHaveTitle('MSupport');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async enterOtp(otp: string) {
    await expect(this.otpInput).toBeVisible({ timeout: OTP_TIMEOUT });
    await this.otpInput.focus();
    await this.page.keyboard.type(otp);
  }

  async verifyDashboard() {
    await expect(this.page).toHaveURL(/dashboard/);
  }
}
