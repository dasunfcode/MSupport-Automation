import { Page, Locator, expect } from '@playwright/test';

const DEFAULT_TIMEOUT = 10_000;
const MENU_OPEN_TIMEOUT = 15_000;
const DESCRIPTION = 'This is an automated description.';

export class TicketPage {
  readonly addTicketButton: Locator;
  readonly nameInput: Locator;
  readonly ticketTypeSection: Locator;
  readonly classifySection: Locator;
  readonly selectAssetButton: Locator;
  readonly escalateButton: Locator;
  readonly descriptionTextarea: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly confirmDeleteButton: Locator;
  readonly searchInput: Locator;

  constructor(readonly page: Page) {
    this.addTicketButton = page.getByText('Add a Ticket');
    this.nameInput = page.getByLabel('Name');
    this.ticketTypeSection = page.locator('text=Select Ticket Type').locator('..');
    this.classifySection = page.locator('text=Classify Issue').locator('..');
    this.selectAssetButton = page.getByText('Select asset', { exact: true });
    this.escalateButton = page.locator('.peer.h-4');
    this.descriptionTextarea = page.locator('textarea[name="description"]');
    this.createButton = page.getByRole('button', { name: 'Create Ticket' });
    this.updateButton = page.getByRole('button', { name: 'Update Ticket' });
    this.confirmDeleteButton = page.getByRole('button', { name: 'Confirm & Delete' });
    this.searchInput = page.getByPlaceholder('Search by Ticket ID, Name, Type...');
  }

  async goto() {
    await this.page.goto('/dashboard/tickets');
  }

  ticketRow(ticketName: string): Locator {
    return this.page.locator('tr', { hasText: ticketName });
  }

  // Opens the row's kebab menu and clicks the requested item, retrying the
  // trigger if the first click is swallowed by a focus/hydration race.
  async openMenuAndClick(row: Locator, menuItemName: string) {
    await expect(row).toBeVisible({ timeout: DEFAULT_TIMEOUT });

    const menuButton = row.getByRole('button', { name: 'Open menu' }).first();
    await expect(menuButton).toBeEnabled({ timeout: DEFAULT_TIMEOUT });

    const dropdown = this.page.locator('[role="menu"]').first();
    const menuItem = dropdown.getByRole('menuitem', { name: menuItemName });

    await expect(async () => {
      if (!(await dropdown.isVisible())) {
        await menuButton.click();
      }
      await expect(menuItem).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: MENU_OPEN_TIMEOUT, intervals: [250, 500, 1000] });

    await menuItem.click();

    if (await dropdown.isVisible().catch(() => false)) {
      await menuItem.click({ force: true });
    }
    await expect(dropdown).toBeHidden({ timeout: 5_000 });
  }

  async addTicket(name: string, adminType: string) {
    await this.addTicketButton.click();
    await this.nameInput.fill(name);
    await this.ticketTypeSection.getByText('Problem', { exact: true }).click();
    await this.classifySection.getByText('Failure Without Downtime', { exact: true }).click();

    await this.selectAssetButton.click();
    const firstAssetOption = this.page.getByRole('option').first();
    await firstAssetOption.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
    await firstAssetOption.click();

    await this.descriptionTextarea.fill(DESCRIPTION);

    if (adminType === 'Global Admin') {
      await expect(this.escalateButton).not.toBeVisible();
    } else {
      await this.escalateButton.click();
    }

    await this.createButton.click();
  }

  async searchTicket(name: string): Promise<Locator> {
    await this.searchInput.fill(name);
    return this.ticketRow(name);
  }

  async editTicket(oldName: string, newName: string) {
    const row = await this.searchTicket(oldName);
    await this.openMenuAndClick(row, 'Edit Ticket');
    await this.nameInput.fill(newName);
    await this.updateButton.click();
    await this.searchInput.fill(newName);
    await expect(this.ticketRow(newName)).toBeVisible();
  }

  async deleteTicket(name: string) {
    const row = await this.searchTicket(name);
    await this.openMenuAndClick(row, 'Delete Ticket');
    await this.confirmDeleteButton.click();
    await this.searchInput.fill(name);
    await expect(this.ticketRow(name)).toHaveCount(0);
  }
}
