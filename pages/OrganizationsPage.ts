import { Page, Locator, expect } from '@playwright/test';

export class OrganizationsPage {
  readonly page: Page;

  readonly addNewButton: Locator;
  readonly dialog: Locator;
  readonly searchInput: Locator;
  readonly nextButton: Locator;
  readonly companyNameInput: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;

  constructor(page: Page) {
    this.page = page;

    this.addNewButton = page.getByRole('button', { name: 'Add New Organization' });
    this.dialog = page.getByRole('dialog');
    this.searchInput = page.getByPlaceholder(
      'Search by Company ID, Company Name, Phone, Email, City, Country, Time Zone, Status'
    );
    this.nextButton = this.dialog.getByRole('button', { name: 'Next' });
    this.companyNameInput = page.getByLabel('Company Name');
    this.phoneInput = page.getByLabel('Phone Number');
    this.emailInput = page.getByLabel('Email Address');
  }

  async goto() {
    await this.page.goto('/dashboard/organizations');
  }

  async openAddOrganization() {
    await this.addNewButton.click();
    await this.dialog.waitFor();
  }

  async selectPartnerType() {
    await this.page.getByText('Extended Service Partner Organization').click();
    await this.nextButton.click();
  }

  async fillBasicDetails(name: string, phone: string, email: string) {
    await this.companyNameInput.fill(name);
    await this.phoneInput.fill(phone);
    await this.emailInput.fill(email);
  }

  async submitOrganization() {
    await this.nextButton.click();
    await this.nextButton.click();
    await this.dialog.getByRole('button', { name: 'Add Organization' }).click();
  }

  async searchOrganization(name: string) {
    await this.searchInput.fill(name);
  }

  rowByName(name: string) {
    return this.page.locator('tr', { hasText: name });
  }

  async openRowMenu(name: string) {
    const row = this.rowByName(name);
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Open menu' }).click();
  }

  private menuItem(name: string | RegExp) {
    return this.page.getByRole('menuitem', { name });
  }

  async clickView() {
    await this.menuItem('View').click();
  }

  async clickEdit() {
    await this.menuItem('Edit').click();
  }

  async updateName(newName: string) {
    await this.companyNameInput.fill(newName);
    await this.dialog.getByRole('button', { name: 'Update Organization' }).click();
  }

  async deactivateOrganization() {
    await this.menuItem('Deactivate Organization').click();
    await this.page.getByRole('button', { name: 'Confirm & Deactivate' }).click();
  }

  async expectVisible(text: string) {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }
}