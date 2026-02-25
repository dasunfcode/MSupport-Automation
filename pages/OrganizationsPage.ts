import { Page, Locator, expect } from '@playwright/test';

export class OrganizationsPage {
  readonly page: Page;

  readonly addNewButton: Locator;
  readonly dialog: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;

    this.addNewButton = page.getByRole('button', { name: 'Add New Organization' });
    this.dialog = page.getByRole('dialog');

    this.searchInput = page.getByPlaceholder(
      'Search by Company ID, Company Name, Phone, Email, City, Country, Time Zone, Status'
    );
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
    await this.page.getByText('Next').click();
  }

  async fillBasicDetails(name: string, phone: string, email: string) {
    await this.page.getByLabel('Company Name').fill(name);
    await this.page.getByLabel('Phone Number').fill(phone);
    await this.page.getByLabel('Email Address').fill(email);
  }

  async submitOrganization() {
    await this.page.getByText('Next').click();
    await this.page.getByText('Next').click();
    await this.page.getByText('Add Organization').click();
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

  async clickView() {
    await this.page.getByText('View').click();
  }

  async clickEdit() {
    await this.page.getByText('Edit').click();
  }

  async updateName(newName: string) {
    await this.page.getByLabel('Company Name').fill(newName);
    await this.page.getByText('Update Organization').click();
  }

  async deactivateOrganization() {
    await this.page.getByText('Deactivate Organization').click();
    await this.page.getByText('Confirm & Deactivate').click();
  }

  async expectVisible(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }
}