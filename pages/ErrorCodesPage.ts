import { Page, Locator, expect } from '@playwright/test';

const GOTO_TIMEOUT = 60_000;
const DEFAULT_TIMEOUT = 10_000;

export const MACHINE_OPTIONS = [
    'MPRINT',
    'MPRINTpro',
    'MPURE',
    'MPUREpro',
    'MPURElite',
    'Standard Module',
    'Heating Module',
    'Lab Module',
    'Extended Module',
];

export type NewErrorCodeInput = {
    machine: string;
    severity: 'Error' | 'Warning';
    systemShort: string;
    subsystem1: string;
    subsystem2: string;
    description: string;
    solution?: string;
};

const slug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

// Error Code Administration page and its "Create Error Code" modal.
export class ErrorCodesPage {
    readonly page: Page;

    // Page
    readonly pageHeading: Locator;
    readonly createErrorButton: Locator;
    readonly totalErrorCodes: Locator;
    readonly solutionsProvided: Locator;
    readonly searchInput: Locator;
    readonly tableRows: Locator;

    // Modal
    readonly dialog: Locator;
    readonly dialogTitle: Locator;
    readonly dialogDescription: Locator;
    readonly closeButton: Locator;
    readonly machineSelect: Locator;
    readonly severityGroup: Locator;
    readonly severityError: Locator;
    readonly severityWarning: Locator;
    readonly systemShortInput: Locator;
    readonly systemNameInput: Locator;
    readonly systemHelperText: Locator;
    readonly subsystem1Input: Locator;
    readonly subsystem1Number: Locator;
    readonly subsystem2Input: Locator;
    readonly subsystem2Number: Locator;
    readonly errorPrefix: Locator;
    readonly descriptionInput: Locator;
    readonly errorNumber: Locator;
    readonly errorNumberHelperText: Locator;
    readonly addSolutionButton: Locator;
    readonly solutionDraft: Locator;
    readonly solutionAddButton: Locator;
    readonly permanentNote: Locator;
    readonly duplicateWarning: Locator;
    readonly submitButton: Locator;

    // Details panel + edit mode
    readonly detailsCode: Locator;
    readonly detailsDescription: Locator;
    readonly detailsSolutions: Locator;
    readonly editButton: Locator;
    readonly editHeading: Locator;
    readonly editMachineSelect: Locator;
    readonly editNotice: Locator;
    readonly updateButton: Locator;
    readonly cancelEditButton: Locator;
    readonly solutionItems: Locator;

    constructor(page: Page) {
        this.page = page;

        this.pageHeading = page.getByRole('heading', { name: 'Error Code Administration', level: 1 });
        this.createErrorButton = page.getByRole('button', { name: 'Create Error' });
        this.totalErrorCodes = page.getByTestId('error-code-stat-total_error_codes');
        this.solutionsProvided = page.getByTestId('error-code-stat-solutions_provided');
        this.searchInput = page.getByPlaceholder('Search by Code, System or description');
        this.tableRows = page.locator('tbody tr');

        this.dialog = page.getByRole('dialog');
        this.dialogTitle = this.dialog.getByRole('heading', { name: 'Create Error Code' });
        this.dialogDescription = this.dialog.getByText(
            'Create a new error code for search, filtering and ticket assignment.'
        );
        this.closeButton = this.dialog.getByRole('button', { name: 'Close' });
        this.machineSelect = this.dialog.getByTestId('create-error-code-machine');
        this.severityGroup = this.dialog.getByRole('radiogroup');
        this.severityError = this.dialog.getByRole('radio', { name: 'Error' });
        this.severityWarning = this.dialog.getByRole('radio', { name: 'Warning' });
        this.systemShortInput = this.dialog.getByRole('combobox', { name: 'System *' });
        this.systemNameInput = this.dialog.getByRole('combobox', { name: 'Full name' });
        this.systemHelperText = this.dialog.getByText(
            'Short code + full name. Pick an existing system or type a new one.'
        );
        this.subsystem1Input = this.dialog.getByRole('combobox', { name: 'Subsystem 1 *' });
        this.subsystem1Number = this.dialog.getByRole('textbox', { name: 'Subsystem 1 number' });
        this.subsystem2Input = this.dialog.getByRole('combobox', { name: 'Subsystem 2 *' });
        this.subsystem2Number = this.dialog.getByRole('textbox', { name: 'Subsystem 2 number' });
        this.errorPrefix = this.dialog.getByRole('textbox', { name: 'Severity prefix' });
        this.descriptionInput = this.dialog.getByRole('combobox', { name: 'Error description' });
        this.errorNumber = this.dialog.getByRole('textbox', { name: 'Error number' });
        this.errorNumberHelperText = this.dialog.getByText(
            "Type the fault's description — the number is assigned automatically."
        );
        this.addSolutionButton = this.dialog.getByRole('button', { name: 'Add a Solution' });
        this.solutionDraft = this.dialog.getByPlaceholder('Describe the solution');
        this.solutionAddButton = this.dialog.getByRole('button', { name: 'Add', exact: true });
        this.permanentNote = this.dialog.getByTestId('create-error-code-permanent-note');
        this.duplicateWarning = this.dialog.getByTestId('create-error-code-duplicate-warning');
        this.submitButton = this.dialog.getByRole('button', { name: 'Create Error Code' });

        this.detailsCode = this.dialog.getByTestId('error-code-view-code');
        this.detailsDescription = this.dialog.getByTestId('error-code-view-description');
        this.detailsSolutions = this.dialog.getByTestId('error-code-view-solutions');
        this.editButton = this.dialog.getByTestId('error-code-panel-edit');
        this.editHeading = this.dialog.getByText('Edit Error Code', { exact: true });
        this.editMachineSelect = this.dialog.getByTestId('edit-error-code-machine');
        this.editNotice = this.dialog.getByText(
            "The machine, severity, system and subsystems can't be changed, so the error code stays the same. Only the description and solutions can be edited."
        );
        this.updateButton = this.dialog.getByTestId('edit-error-code-submit');
        this.cancelEditButton = this.dialog.getByTestId('edit-error-code-cancel');
        this.solutionItems = this.dialog.getByTestId(/^error-code-solution-[0-9a-f-]{36}$/);
    }

    async goto() {
        await this.page.goto('/error-codes', { waitUntil: 'domcontentloaded', timeout: GOTO_TIMEOUT });
        await this.pageHeading.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
        await expect(this.totalErrorCodes).toContainText(/\d+/);
    }

    // ---------- Page-level helpers ----------

    async readStat(stat: Locator): Promise<number> {
        await expect(stat).toContainText(/\d+/);
        const text = (await stat.innerText()).trim();
        return Number(text.match(/\d+/)![0]);
    }

    async readTotalErrorCodes(): Promise<number> {
        return this.readStat(this.totalErrorCodes);
    }

    async readSolutionsProvided(): Promise<number> {
        return this.readStat(this.solutionsProvided);
    }

    async expectTotalErrorCodes(expected: number) {
        await expect(this.totalErrorCodes).toContainText(String(expected));
    }

    async expectSolutionsProvided(expected: number) {
        await expect(this.solutionsProvided).toContainText(String(expected));
    }

    async search(term: string) {
        await this.searchInput.fill(term);
    }

    rowByText(text: string | RegExp): Locator {
        return this.tableRows.filter({ hasText: text }).first();
    }

    async expectRowVisible(text: string | RegExp) {
        await expect(this.rowByText(text)).toBeVisible();
    }

    async expectNoRow(text: string | RegExp) {
        await expect(this.tableRows.filter({ hasText: text })).toHaveCount(0);
    }

    async filterByMachineType(key: 'all' | 'mpr' | 'mprp' | 'mpu' | 'mpup' | 'mbm') {
        await this.page.getByTestId(`filter-machine-type-${key}`).click();
    }

    async filterByErrorType(key: 'all' | 'error' | 'warning') {
        await this.page.getByTestId(`filter-error-type-${key}`).click();
    }

    async filterByView(key: 'all' | 'active') {
        await this.page.getByTestId(`filter-view-${key}`).click();
    }

    async archiveRow(text: string | RegExp) {
        await this.rowByText(text).getByRole('button', { name: 'Open menu' }).click();
        await this.page.getByRole('menuitem', { name: 'Archive' }).click();
        await this.page.getByRole('dialog').getByRole('button', { name: 'Archive', exact: true }).click();
        await expect(this.page.getByText('Error code archived successfully')).toBeVisible();
    }

    // ---------- Modal open / close ----------

    async expectRequiredLabel(label: string) {
        await expect(this.dialog.getByText(new RegExp(`^${label}\\s*\\*$`))).toBeVisible();
    }

    async openCreateDialog() {
        await this.createErrorButton.click();
        await expect(this.dialogTitle).toBeVisible();
    }

    async expectDialogOpen() {
        await expect(this.dialog).toBeVisible();
        await expect(this.dialogTitle).toBeVisible();
        await expect(this.dialogDescription).toBeVisible();
    }

    async expectDialogClosed() {
        await expect(this.dialog).toBeHidden();
    }

    async closeDialog() {
        await this.closeButton.click();
        await this.expectDialogClosed();
    }

    // ---------- Machine ----------

    async openMachineOptions() {
        await this.machineSelect.click();
    }

    async selectMachine(name: string) {
        await this.openMachineOptions();
        await this.page.getByRole('option', { name, exact: true }).click();
        await expect(this.machineSelect).toHaveText(name);
    }

    async expectMachineOptions(options: string[]) {
        await this.openMachineOptions();
        await expect(this.page.getByRole('option')).toHaveText(options);
        await this.page.keyboard.press('Escape');
    }

    async expectNoMachinePreselected() {
        await expect(this.machineSelect).toHaveText('Select a machine');
    }

    async expectMachineSelected(name: string) {
        await expect(this.machineSelect).toHaveText(name);
    }

    // ---------- Severity ----------

    async selectSeverity(severity: 'Error' | 'Warning') {
        await this.dialog.getByRole('radio', { name: severity }).click();
    }

    async expectSeveritySelected(severity: 'Error' | 'Warning') {
        const other = severity === 'Error' ? 'Warning' : 'Error';
        await expect(this.dialog.getByRole('radio', { name: severity })).toBeChecked();
        await expect(this.dialog.getByRole('radio', { name: other })).not.toBeChecked();
    }

    async expectErrorPrefix(prefix: 'E' | 'W') {
        await expect(this.errorPrefix).toHaveValue(prefix);
        await expect(this.errorPrefix).toBeDisabled();
    }

    // ---------- System ----------

    systemShortOption(code: string): Locator {
        return this.page.getByTestId(`create-error-code-system-short-suggestions-${slug(code)}`);
    }

    systemNameOption(name: string): Locator {
        return this.page.getByTestId(`create-error-code-system-name-suggestions-${slug(name)}`);
    }

    async selectSystemShort(code: string) {
        await this.systemShortInput.click();
        await this.systemShortOption(code).click();
    }

    async typeNewSystem(short: string, fullName: string) {
        await this.systemShortInput.fill(short);
        await this.systemNameInput.fill(fullName);
    }

    async expectSystem(short: string, fullName: string | RegExp) {
        await expect(this.systemShortInput).toHaveValue(short);
        await expect(this.systemNameInput).toHaveValue(fullName);
    }

    async pickSystemByFullName(partial: string, fullName: string) {
        await this.systemNameInput.click();
        await this.systemNameInput.pressSequentially(partial);
        await this.systemNameOption(fullName).click();
    }

    // ---------- Subsystems / description ----------

    private async pickOrType(input: Locator, testIdPrefix: string, value: string, existing: boolean) {
        await input.click();
        if (existing) {
            await this.page.getByTestId(`${testIdPrefix}-suggestions-${slug(value)}`).click();
        } else {
            await input.fill(value);
        }
    }

    async fillSubsystem1(value: string, existing = false) {
        await this.pickOrType(this.subsystem1Input, 'create-error-code-subsystem-1-name', value, existing);
    }

    async fillSubsystem2(value: string, existing = false) {
        await this.pickOrType(this.subsystem2Input, 'create-error-code-subsystem-2-name', value, existing);
    }

    async fillDescription(value: string) {
        await this.descriptionInput.fill(value);
    }

    // Opens the suggestion list and returns the option labels shown.
    async readSuggestions(input: Locator, idPrefix: string): Promise<string[]> {
        await input.click();
        const options = this.page.locator(`[data-testid^="${idPrefix}-suggestions-"]`);
        await expect(options.first()).toBeVisible();
        return (await options.allInnerTexts()).map(text => text.trim());
    }

    async pickFirstSubsystem1Suggestion(): Promise<string> {
        const options = this.page.locator('[data-testid^="create-error-code-subsystem-1-name-suggestions-"]');
        await this.subsystem1Input.click();
        await expect(options.first()).toBeVisible();
        const label = (await options.first().innerText()).trim();
        await options.first().click();
        return label;
    }

    async expectSuggestionNote(note: string) {
        await expect(this.dialog.getByText(note)).toBeVisible();
    }

    // ---------- Solutions ----------

    async addSolution(text: string) {
        await this.addSolutionButton.click();
        await this.solutionDraft.fill(text);
        await this.solutionAddButton.click();
        await expect(this.dialog.getByText(text)).toBeVisible();
    }

    // ---------- Submit ----------

    async fillForm(input: NewErrorCodeInput) {
        await this.selectMachine(input.machine);
        await this.selectSeverity(input.severity);
        await this.selectSystemShort(input.systemShort);
        await this.fillSubsystem1(input.subsystem1);
        await this.fillSubsystem2(input.subsystem2);
        await this.fillDescription(input.description);
        if (input.solution) {
            await this.addSolution(input.solution);
        }
    }

    async submit() {
        await this.submitButton.click();
    }

    async createErrorCode(input: NewErrorCodeInput) {
        await this.fillForm(input);
        await this.submit();
        await expect(this.page.getByText('Error code created successfully')).toBeVisible();
        await this.expectDialogClosed();
    }

    async expectRequiredValidationMessages() {
        const messages = [
            'Machine is required',
            'System short code is required',
            'System name is required',
            'Subsystem 1 name is required',
            'Subsystem 2 name is required',
            'Description is required',
        ];
        for (const message of messages) {
            await expect(this.dialog.getByText(message)).toBeVisible();
        }
        await this.expectDialogOpen();
    }

    async expectDuplicateWarning(code: string | RegExp) {
        await expect(this.duplicateWarning).toContainText(code);
        await expect(this.duplicateWarning).toContainText('already exists with the same selected inputs');
        await expect(this.submitButton).toBeDisabled();
    }

    // ---------- Details panel ----------

    async openDetails(description: string) {
        await this.search(description);
        const row = this.rowByText(description);
        await expect(row).toBeVisible();
        await row.getByRole('cell').first().click();
        await expect(this.detailsCode).toBeVisible();
        await expect(this.editButton).toBeVisible();
    }

    async expectDetails(fields: { description?: string; solutions?: string[]; absentSolutions?: string[] }) {
        if (fields.description !== undefined) {
            await expect(this.detailsDescription).toContainText(fields.description);
        }
        for (const text of fields.solutions ?? []) {
            await expect(this.detailsSolutions).toContainText(text);
        }
        for (const text of fields.absentSolutions ?? []) {
            await expect(this.detailsSolutions).not.toContainText(text);
        }
    }

    // ---------- Edit mode ----------

    async startEdit() {
        await this.editButton.click();
        await expect(this.editHeading).toBeVisible();
    }

    async cancelEdit() {
        await this.cancelEditButton.click();
        await expect(this.editHeading).toBeHidden();
        await expect(this.editButton).toBeVisible();
    }

    async expectReadOnlyFieldsDisabled() {
        await expect(this.editMachineSelect).toBeDisabled();
        await expect(this.severityError).toBeDisabled();
        await expect(this.severityWarning).toBeDisabled();
        await expect(this.systemShortInput).toBeDisabled();
        await expect(this.systemNameInput).toBeDisabled();
        await expect(this.subsystem1Input).toBeDisabled();
        await expect(this.subsystem1Number).toBeDisabled();
        await expect(this.subsystem2Input).toBeDisabled();
        await expect(this.subsystem2Number).toBeDisabled();
        await expect(this.errorPrefix).toBeDisabled();
        await expect(this.errorNumber).toBeDisabled();
        await expect(this.descriptionInput).toBeEnabled();
        await expect(this.addSolutionButton).toBeEnabled();
    }

    async update() {
        await this.updateButton.click();
        await expect(this.page.getByText('Error code updated successfully')).toBeVisible();
        await expect(this.editHeading).toBeHidden();
    }

    solutionItem(text: string): Locator {
        return this.solutionItems.filter({ hasText: text });
    }

    async editSolution(oldText: string, newText: string) {
        await this.solutionItem(oldText).getByTestId(/-menu$/).click();
        await this.page.getByRole('menuitem', { name: 'Edit' }).click();
        await this.dialog.getByTestId(/-edit-draft$/).fill(newText);
        await this.dialog.getByTestId(/-edit-save$/).click();
        await expect(this.solutionItem(newText)).toBeVisible();
    }

    async removeSolution(text: string) {
        await this.solutionItem(text).getByTestId(/-menu$/).click();
        await this.page.getByRole('menuitem', { name: 'Remove' }).click();
        await expect(this.solutionItem(text)).toHaveCount(0);
    }
}
