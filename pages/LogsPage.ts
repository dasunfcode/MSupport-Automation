import { Page, Locator, expect } from '@playwright/test';

export class LogsPage {
  readonly page: Page;

  readonly organizationsTab: Locator;
  readonly usersTab: Locator;
  readonly assetsTab: Locator;
  readonly ticketsTab: Locator;

  constructor(page: Page) {
    this.page = page;

    this.organizationsTab = page.getByRole('button', { name: 'Organizations' });
    this.usersTab = page.getByRole('button', { name: 'users' });
    this.assetsTab = page.getByRole('button', { name: 'Assets' });
    this.ticketsTab = page.getByRole('button', { name: 'tickets' });
  }

  async goto() {
    await this.page.goto('/dashboard/logs', { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('table tbody tr');
  }

  async expectAllTabsVisible() {
    await expect(this.organizationsTab).toBeVisible();
    await expect(this.usersTab).toBeVisible();
    await expect(this.assetsTab).toBeVisible();
    await expect(this.ticketsTab).toBeVisible();
  }
}