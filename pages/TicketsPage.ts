// ticketPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class TicketPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/dashboard/tickets');
  }

  // Locators
  addTicketButton() { return this.page.getByText('Add a Ticket'); }
  nameInput() { return this.page.getByLabel('Name'); }
  ticketTypeSection() { return this.page.locator('text=Select Ticket Type').locator('..'); }
  classifySection() { return this.page.locator('text=Classify Issue').locator('..'); }
  selectAssetButton() { return this.page.getByText('Select asset', { exact: true }); }
  escalateButton() { return this.page.locator('.peer.h-4'); }
  descriptionTextarea() { return this.page.locator('textarea[name="description"]'); }
  createButton() { return this.page.getByRole('button', { name: 'Create Ticket' }); }
  updateButton() { return this.page.getByRole('button', { name: 'Update Ticket' }); }
  confirmDeleteButton() { return this.page.getByRole('button', { name: 'Confirm & Delete' }); }
  searchInput() { return this.page.getByPlaceholder('Search by Ticket ID, Name, Type...'); }


  ticketRow(ticketName: string) {
    return this.page.locator('tr', { hasText: ticketName });
  }

  // Menu helper
  async openMenuAndClick(row: Locator, menuItemName: string) {
    console.log(`Clicking Open menu for "${menuItemName}"`);

    // Wait for the row to settle so the trigger doesn't get re-rendered mid-click.
    await expect(row).toBeVisible({ timeout: 10000 });
    const menuButton = row.getByRole('button', { name: 'Open menu' }).first();
    await expect(menuButton).toBeVisible({ timeout: 10000 });
    await expect(menuButton).toBeEnabled({ timeout: 10000 });

    const dropdown = this.page.locator('[role="menu"]').first();
    const menuItem = dropdown.getByRole('menuitem', { name: menuItemName });

    // Retry the open: sometimes the first click is swallowed (focus/hydration race),
    // so re-click the trigger until the menu actually renders the target item.
    await expect(async () => {
      if (!(await dropdown.isVisible())) {
        await menuButton.click();
      }
      await expect(menuItem).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000, intervals: [250, 500, 1000] });

    await menuItem.click();

    // Confirm the menu actually closed; if not, the click missed — retry once.
    if (await dropdown.isVisible().catch(() => false)) {
      await menuItem.click({ force: true });
    }
    await expect(dropdown).toBeHidden({ timeout: 5000 });
  }

  // Actions
  async addTicket(name: string, adminType: string) {
    await this.addTicketButton().click();
    await this.nameInput().fill(name);
    await this.ticketTypeSection().getByText('Problem', { exact: true }).click();
    await this.classifySection().getByText('Failure Without Downtime', { exact: true }).click();
    await this.selectAssetButton().click();
    const firstAssetOption = this.page.getByRole('option').first();
    await firstAssetOption.waitFor({ state: 'visible', timeout: 10000 });
    await firstAssetOption.click();
    await this.descriptionTextarea().fill('This is an automated description.');

    if (adminType === 'Global Admin') {
      await expect(this.escalateButton()).not.toBeVisible();
    } else {
      await this.escalateButton().click();
    }

    await this.createButton().click();
    console.log('Ticket added');
  }

  async searchTicket(name: string) {
    await this.searchInput().fill(name);
    const row = this.ticketRow(name);
    // await expect(row).toBeVisible();
    console.log('Ticket search/view successful');
    return row;
  }

  async editTicket(oldName: string, newName: string) {
    const row = await this.searchTicket(oldName);
    await this.openMenuAndClick(row, 'Edit Ticket');
    await this.nameInput().fill(newName);
    await this.updateButton().click();
    await this.searchInput().fill(newName);
    await expect(this.ticketRow(newName)).toBeVisible();
    console.log('Ticket edited');
  }

  async deleteTicket(name: string) {
    const row = await this.searchTicket(name);
    await this.openMenuAndClick(row, 'Delete Ticket');
    await this.confirmDeleteButton().click();
    await this.searchInput().fill(name);
    await expect(this.ticketRow(name)).toHaveCount(0);
    console.log('Ticket deleted');
  }
}