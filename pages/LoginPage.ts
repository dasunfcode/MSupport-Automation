import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly otpInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.otpInput = page.locator('input[data-input-otp="true"]');
  }

  async goto(baseUrl: string) {
    await this.page.goto(`${baseUrl}/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
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
    await expect(this.otpInput).toBeVisible({ timeout: 30000 });
    await this.otpInput.focus();
    await this.page.keyboard.type(otp);
  }

  async verifyDashboard() {
    await expect(this.page).toHaveURL(/dashboard\/organizations/);
  }
}