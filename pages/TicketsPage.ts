// ticketPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class TicketPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // Locators
  addTicketButton() { return this.page.getByText('Add a Ticket'); }
  nameInput() { return this.page.getByLabel('Name'); }
  ticketTypeSection() { return this.page.locator('text=Select Ticket Type').locator('..'); }
  classifySection() { return this.page.locator('text=Classify Issue').locator('..'); }
  selectAssetButton() { return this.page.getByText('Select asset', { exact: true }); }
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
    const menuButton = row.getByRole('button', { name: 'Open menu' }).first();
    console.log(`Clicking Open menu for "${menuItemName}"`);
    await expect(menuButton).toBeVisible({ timeout: 10000 });
    await menuButton.click();

    const dropdown = this.page.locator('[role="menu"]').first();
    await expect(dropdown).toBeVisible({ timeout: 10000 });

    const menuItem = dropdown.getByRole('menuitem', { name: menuItemName });
    await expect(menuItem).toBeVisible({ timeout: 10000 });

    await menuItem.click();
  }

  // Actions
  async addTicket(name: string) {
    await this.addTicketButton().click();
    await this.nameInput().fill(name);
    await this.ticketTypeSection().getByText('Problem', { exact: true }).click();
    await this.classifySection().getByText('Failure without downtime', { exact: true }).click();
    await this.selectAssetButton().click();
    await this.page.getByText('MPU99993', { exact: true }).click();
    await this.descriptionTextarea().fill('This is an automated description.');
    await this.createButton().click();
    console.log('Ticket added');
  }

  async searchTicket(name: string) {
    await this.searchInput().fill(name);
    const row = this.ticketRow(name);
    await expect(row).toBeVisible();
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