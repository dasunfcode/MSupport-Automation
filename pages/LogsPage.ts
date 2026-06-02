import { Page, Locator, expect } from '@playwright/test';

const TAB_NAMES = ['Organizations', 'users', 'Assets', 'tickets'] as const;
type TabName = typeof TAB_NAMES[number];

export class LogsPage {
  readonly page: Page;
  readonly tabs: Record<TabName, Locator>;

  constructor(page: Page) {
    this.page = page;
    this.tabs = Object.fromEntries(
      TAB_NAMES.map((name) => [name, page.getByRole('button', { name })])
    ) as Record<TabName, Locator>;
  }

  async goto() {
    await this.page.goto('/dashboard/logs', { waitUntil: 'domcontentloaded' });
    await this.page.waitForSelector('table tbody tr');
  }

  async expectAllTabsVisible() {
    await Promise.all(TAB_NAMES.map((name) => expect(this.tabs[name]).toBeVisible()));
  }
}
