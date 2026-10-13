import { Page, Locator, expect } from '@playwright/test';

const DEFAULT_TIMEOUT = 10_000;
const MENU_OPEN_TIMEOUT = 15_000;
const DESCRIPTION = 'This is an automated description.';

export class TicketPage {
  readonly addTicketButton: Locator;
  readonly nameInput: Locator;
  readonly ticketTypeSection: Locator;
  readonly classifySection: Locator;
  readonly deviceTypeButton: Locator;
  readonly selectAssetButton: Locator;
  readonly escalateButton: Locator;
  readonly descriptionTextarea: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly confirmDeleteButton: Locator;
  readonly searchInput: Locator;
  readonly updateRow: Locator;
  readonly editButton: Locator;
  readonly closeButton: Locator;

  // Error code selection
  readonly errorCodeField: Locator;
  readonly assignedErrorCode: Locator;
  readonly changeErrorCodeButton: Locator;
  readonly errorCodeReferencePanel: Locator;
  readonly errorCodeReferenceDescription: Locator;
  readonly errorCodeTooltipTrigger: Locator;
  readonly assignDialog: Locator;
  readonly assignSearchInput: Locator;
  readonly thisMachineToggle: Locator;
  readonly allMachinesToggle: Locator;
  readonly errorCodeOptions: Locator;
  readonly errorCodeLoadMore: Locator;
  readonly assignSubmitButton: Locator;
  readonly noErrorCodesFound: Locator;
  constructor(readonly page: Page) {
    this.addTicketButton = page.getByText('Add a Ticket');
    this.nameInput = page.getByLabel('Name');
    this.ticketTypeSection = page.locator('text=Select Ticket Type').locator('..');
    this.classifySection = page.locator('text=Classify Issue').locator('..');
    this.deviceTypeButton = page.getByRole('combobox').filter({ hasText: 'Select device type' });
    this.selectAssetButton = page.getByText('Select asset', { exact: true });
    this.escalateButton = page.locator('.peer.h-4');
    this.descriptionTextarea = page.locator('textarea[name="description"]');
    this.createButton = page.getByRole('button', { name: 'Create Ticket' });
    this.updateButton = page.getByRole('button', { name: 'Update Ticket' });
    this.confirmDeleteButton = page.getByRole('button', { name: 'Confirm & Delete' });
    this.searchInput = page.getByPlaceholder('Search by Ticket ID, Name, Type...');
    this.updateRow = page.getByRole('cell', { name: 'Test Ticket' });
    this.editButton = page.getByRole('button', { name: 'edit', exact: true });
    this.closeButton = page.getByRole('button', { name: 'Close', exact: true });

    this.errorCodeField = page.getByTestId('ticket-error-code-assign');
    this.assignedErrorCode = page.getByTestId('ticket-error-code-assigned');
    this.changeErrorCodeButton = page.getByTestId('ticket-error-code-change');
    this.errorCodeReferencePanel = page.getByTestId('error-code-reference-panel');
    this.errorCodeReferenceDescription = page.getByTestId('error-code-reference-description');
    this.errorCodeTooltipTrigger = page.getByTestId('errorCodeId-label-tooltip');
    this.assignDialog = page
      .getByRole('dialog')
      .filter({ hasText: 'Search the error codes by code or fault description' });
    this.assignSearchInput = this.assignDialog.getByPlaceholder('Search code or fault description...');
    this.thisMachineToggle = this.assignDialog.getByTestId('assign-error-code-this-machine');
    this.allMachinesToggle = this.assignDialog.getByTestId('assign-error-code-all-machines');
    this.errorCodeOptions = this.assignDialog.getByTestId(/^assign-error-code-option-/);
    this.errorCodeLoadMore = this.assignDialog.getByTestId('assign-error-code-load-more');
    this.assignSubmitButton = this.assignDialog.getByTestId('assign-error-code-submit');
    this.noErrorCodesFound = this.assignDialog.getByText('No error codes found');
  }

  async goto() {
    await this.page.goto('/tickets');
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

  async addTicket(name: string, adminType: string, errorCode?: string | true): Promise<string | undefined> {
    await this.openAddTicketForm();
    await this.nameInput.fill(name);
    await this.ticketTypeSection.getByText('Problem', { exact: true }).click();
    await this.classifySection.getByText('Failure Without Downtime', { exact: true }).click();

    // The asset selector is disabled until a device type is chosen.
    await this.deviceTypeButton.click();
    const firstDeviceOption = this.page.getByRole('option').first();
    await firstDeviceOption.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
    await firstDeviceOption.click();

    await this.selectAssetButton.click();
    const firstAssetOption = this.page.getByRole('option').first();
    await firstAssetOption.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
    await firstAssetOption.click();

    let assignedCode: string | undefined;
    if (errorCode) {
      assignedCode = await this.assignErrorCode(errorCode);
    }

    await this.descriptionTextarea.fill(DESCRIPTION);

    if (adminType === 'Global Admin') {
      await expect(this.escalateButton).toHaveCount(0);
    } else if (await this.escalateButton.count() > 0) {
      await this.escalateButton.first().click();
    }

    await this.createButton.click();
    return assignedCode;
  }

  // ---------- Error code selection ----------

  async openAddTicketForm() {
    await this.addTicketButton.click();
    await expect(this.nameInput).toBeVisible({ timeout: DEFAULT_TIMEOUT });
  }

  async selectDeviceType(name: string) {
    await this.deviceTypeButton.click();
    await this.page.getByRole('option', { name, exact: true }).click();
  }

  async openErrorCodeModal() {
    await this.errorCodeField.click();
    await expect(this.assignDialog).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    await expect(this.errorCodeOptions.first()).toBeVisible({ timeout: DEFAULT_TIMEOUT });
  }

  async closeErrorCodeModal() {
    await this.assignDialog.getByRole('button', { name: 'Close' }).click();
    await expect(this.assignDialog).toBeHidden();
  }

  async searchErrorCodes(term: string) {
    await this.assignSearchInput.fill(term);
  }

  errorCodeOption(code: string): Locator {
    return this.assignDialog.getByTestId(`assign-error-code-option-${code}`);
  }

  // Option text is "<code>\n<description>\n<system> · <subsystem 1> / <subsystem 2>".
  async readOption(option: Locator): Promise<{ code: string; description: string; faultyPart: string }> {
    const [code = '', description = '', location = ''] = (await option.innerText())
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    const faultyPart = location.split('/').pop()?.trim() ?? '';
    return { code, description, faultyPart };
  }

  async listedCodes(): Promise<string[]> {
    const options = await this.errorCodeOptions.all();
    return Promise.all(options.map(async option => (await this.readOption(option)).code));
  }

  async expectAllListedCodesStartWith(prefix: string) {
    await expect(this.errorCodeOptions.first()).toBeVisible();
    for (const code of await this.listedCodes()) {
      expect(code.startsWith(`${prefix}-`), `${code} should start with ${prefix}-`).toBe(true);
    }
  }

  // Every listed option must contain the term (code, description or faulty part).
  async expectAllResultsContain(term: string) {
    await expect(this.errorCodeOptions.first()).toBeVisible();
    await expect(async () => {
      for (const option of await this.errorCodeOptions.all()) {
        expect((await option.innerText()).toLowerCase()).toContain(term.toLowerCase());
      }
    }).toPass({ timeout: DEFAULT_TIMEOUT });
  }

  async expectErrorCodeNotListed(code: string) {
    await this.searchErrorCodes(code);
    await expect(this.noErrorCodesFound).toBeVisible();
    await expect(this.errorCodeOption(code)).toHaveCount(0);
  }

  async loadMoreErrorCodes() {
    const before = await this.errorCodeOptions.count();
    await this.errorCodeLoadMore.scrollIntoViewIfNeeded();
    await expect(async () => {
      expect(await this.errorCodeOptions.count()).toBeGreaterThan(before);
    }).toPass({ timeout: DEFAULT_TIMEOUT });
  }

  // Picks the code in the open modal and confirms the selection.
  async selectErrorCode(option: Locator) {
    const { code } = await this.readOption(option);
    await option.click();
    await expect(option).toHaveAttribute('aria-checked', 'true');
    await this.assignSubmitButton.click();
    await expect(this.assignDialog).toBeHidden();
    return code;
  }

  // `true` picks the first listed code; a string searches for that code, widening to all machines if needed.
  async assignErrorCode(errorCode: string | true): Promise<string> {
    await this.openErrorCodeModal();
    if (errorCode === true) {
      return this.selectErrorCode(this.errorCodeOptions.first());
    }
    await this.searchErrorCodes(errorCode);
    if (await this.errorCodeOption(errorCode).count() === 0 && await this.allMachinesToggle.isVisible()) {
      await this.allMachinesToggle.click();
    }
    return this.selectErrorCode(this.errorCodeOption(errorCode));
  }

  async expectAssignedErrorCode(code: string) {
    await expect(this.assignedErrorCode).toHaveText(code);
    await expect(this.errorCodeReferencePanel).toBeVisible();
  }

  async openTicketDetails(name: string) {
    const row = await this.searchTicket(name);
    await expect(row.first()).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    await row.first().getByRole('cell').first().click();
    await expect(this.errorCodeReferencePanel).toBeVisible({ timeout: DEFAULT_TIMEOUT });
  }

  async expectDetailsErrorCode(code: string) {
    await expect(this.page.getByRole('dialog').getByText(code, { exact: true })).toBeVisible();
  }

  async searchTicket(name: string): Promise<Locator> {
    await this.searchInput.fill(name);
    return this.ticketRow(name);
  }

  async editTicket(oldName: string, newName: string) {
    const row = await this.searchTicket(oldName);
    await expect(row.first()).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    await row.first().getByRole('cell').first().click();
    await this.editButton.click();
    await this.nameInput.fill(newName);
    await this.updateButton.click();
    await this.searchInput.fill(newName);
    await expect(this.ticketRow(newName).first()).toBeVisible();
    await this.closeButton.click();
  }

  async deleteTicket(name: string) {
    const row = await this.searchTicket(name);
    await this.openMenuAndClick(row, 'Delete Ticket');
    await this.confirmDeleteButton.click();
    await this.searchInput.fill(name);
    await expect(this.ticketRow(name)).toHaveCount(0);
  }
}
