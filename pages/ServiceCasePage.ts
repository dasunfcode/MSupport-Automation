import { Page, Locator, expect } from '@playwright/test';

const GOTO_TIMEOUT = 60_000;
const DEFAULT_TIMEOUT = 10_000;

/** Ticket type options offered on the Create Service Case form. */
export type ServiceCaseType = 'Problem' | 'Feedback' | 'Question' | 'Request' | 'Other';

/** Document classification options available per uploaded file. */
export type DocumentTag = 'Untagged' | 'Faulty Part' | 'Damage Photo' | 'Dump File';

/**
 * Page Object for the public Create Service Case form.
 *
 * Lives on a dedicated host (https://qa.form.msupport.am/ticket-form) and does
 * NOT require authentication. The form is a reusable embed: ticket type radios,
 * device/asset/company custom (Radix) comboboxes, contact fields and a file
 * upload area, ending on a /ticket-created confirmation page.
 */
export class ServiceCasePage {
    readonly page: Page;

    // Ticket type
    readonly ticketTypeGroup: Locator;

    // Ticket information
    readonly ticketNameInput: Locator;
    readonly deviceTypeTrigger: Locator;
    readonly affectedAssetTrigger: Locator;
    readonly descriptionInput: Locator;

    // Contact information
    readonly nameInput: Locator;
    readonly companyTrigger: Locator;
    readonly emailInput: Locator;

    // Files
    readonly fileInput: Locator;
    readonly uploadZone: Locator;

    // Submit
    readonly submitButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.ticketTypeGroup = page.getByRole('radiogroup', { name: 'Select Ticket Type' });

        this.ticketNameInput = page.locator('#ticketName');
        this.deviceTypeTrigger = page.getByRole('combobox').filter({ hasText: 'Select a device type' });
        this.affectedAssetTrigger = page.getByRole('combobox').filter({ hasText: 'Search asset by serial number' });
        this.descriptionInput = page.locator('textarea[name="description"]');

        this.nameInput = page.locator('#fullName');
        this.companyTrigger = page.getByRole('combobox').filter({ hasText: 'Search company' });
        this.emailInput = page.locator('#email');

        this.fileInput = page.locator('#file-upload-files');
        this.uploadZone = page.getByText('Drag and Drop or Click Here to upload files');

        this.submitButton = page.getByTestId('ticket-submit-button');
    }

    /** Base URL of the public form host (overridable via FORM_BASE_URL). */
    private static get formBaseUrl(): string {
        return process.env.FORM_BASE_URL || 'https://qa.form.msupport.am';
    }

    async goto() {
        await this.page.goto(`${ServiceCasePage.formBaseUrl}/ticket-form`, {
            waitUntil: 'domcontentloaded',
            timeout: GOTO_TIMEOUT,
        });
        await expect(this.page.getByRole('heading', { name: 'Create new ticket' })).toBeVisible({
            timeout: DEFAULT_TIMEOUT,
        });
    }

    // ---------------------------------------------------------------- ticket type

    /** Selects a Service Case type. Radios are single-select (see assertion helper). */
    async selectTicketType(type: ServiceCaseType) {
        // The radio input's accessible name is polluted by the group label, so
        // click the visible option label inside the group instead.
        await this.ticketTypeGroup.getByText(type, { exact: true }).click();
        await expect(this.ticketTypeRadio(type)).toBeChecked();
    }

    ticketTypeRadio(type: ServiceCaseType): Locator {
        return this.page.getByTestId(`ticket-type-${type.toLowerCase()}`);
    }

    /** Verifies exactly one type is selected and the others are cleared. */
    async expectOnlyTicketTypeSelected(selected: ServiceCaseType) {
        const all: ServiceCaseType[] = ['Problem', 'Feedback', 'Question', 'Request', 'Other'];
        await expect(this.ticketTypeRadio(selected)).toBeChecked();
        for (const type of all.filter((t) => t !== selected)) {
            await expect(this.ticketTypeRadio(type)).not.toBeChecked();
        }
    }

    // ---------------------------------------------------------------- ticket info

    async fillTicketName(name: string) {
        await this.ticketNameInput.fill(name);
    }

    async fillDescription(text: string) {
        await this.descriptionInput.fill(text);
    }

    async selectDeviceType(deviceType: string) {
        await this.deviceTypeTrigger.click();
        await this.page.getByRole('option', { name: deviceType, exact: true }).click();
        await expect(this.page.getByRole('combobox').filter({ hasText: deviceType })).toBeVisible();
    }

    /** Affected Asset only becomes enabled after a Device Type is chosen. */
    async expectAffectedAssetDisabled() {
        await expect(this.affectedAssetTrigger).toBeDisabled();
    }

    /** Once a device type is selected the Affected Asset field is mandatory (red *). */
    async expectAffectedAssetMandatory() {
        const group = this.page.getByRole('group').filter({ hasText: 'Affected Asset' });
        await expect(group.getByText('*')).toBeVisible();
    }

    async selectAffectedAsset(serial: string) {
        await this.affectedAssetTrigger.click();
        const search = this.page.getByPlaceholder('Search asset by serial number...');
        await search.fill(serial);
        await this.page.getByRole('option', { name: serial, exact: true }).click();
    }

    // ---------------------------------------------------------------- contact info

    async fillName(name: string) {
        await this.nameInput.fill(name);
    }

    async fillEmail(email: string) {
        await this.emailInput.fill(email);
    }

    /** Enters then clears the Ticket Name and blurs it to surface the required error. */
    async touchAndClearTicketName() {
        await this.ticketNameInput.fill('temp');
        await this.ticketNameInput.fill('');
        await this.ticketNameInput.blur();
    }

    /** Enters an invalid email and blurs it to surface the format error. */
    async fillEmailAndBlur(email: string) {
        await this.emailInput.fill(email);
        await this.emailInput.blur();
    }

    /**
     * Selects a company. `search` is typed into the filter; `optionName`
     * (defaults to `search`) is the exact option label to click.
     */
    async selectCompany(search: string, optionName: string = search) {
        await this.companyTrigger.click();
        const input = this.page.getByPlaceholder('Search company...');
        await input.fill(search);
        await this.page.getByRole('option', { name: optionName, exact: true }).click();
    }

    // ---------------------------------------------------------------- files

    /** Uploads one or more files via the hidden multiple file input. */
    async uploadFiles(paths: string | string[]) {
        await this.fileInput.setInputFiles(paths);
    }

    /** The uploaded-file row, located by its filename plus its per-file tag combobox. */
    uploadedFileRow(fileName: string): Locator {
        return this.page
            .locator('div')
            .filter({ hasText: fileName })
            .filter({ has: this.page.getByRole('combobox', { name: `Tag for ${fileName}` }) })
            .last();
    }

    async expectFileUploaded(fileName: string) {
        const row = this.uploadedFileRow(fileName);
        await expect(row).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(row.getByText(fileName, { exact: true })).toBeVisible();
        // Upload date/time in the form YYYY-MM-DD HH:mm
        await expect(row.getByText(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)).toBeVisible();
    }

    async setDocumentTag(fileName: string, tag: DocumentTag) {
        const combobox = this.page.getByRole('combobox', { name: `Tag for ${fileName}` });
        await combobox.click();
        await this.page.getByRole('option', { name: tag, exact: true }).click();
        await expect(combobox).toContainText(tag);
    }

    async deleteUploadedFile(fileName: string) {
        const row = this.uploadedFileRow(fileName);
        // The only button-role element in the row is the delete icon button;
        // the tag control exposes role=combobox, so it is not matched here.
        await row.getByRole('button').click();
        await expect(this.page.getByRole('combobox', { name: `Tag for ${fileName}` })).toHaveCount(0);
    }

    // ---------------------------------------------------------------- submit

    async expectSubmitDisabled() {
        await expect(this.submitButton).toBeDisabled();
    }

    async expectSubmitEnabled() {
        await expect(this.submitButton).toBeEnabled();
    }

    async submit() {
        await this.submitButton.click();
    }

    // ---------------------------------------------------------------- assertions

    /** A field-level validation alert with the given text. */
    async expectFieldError(message: string | RegExp) {
        await expect(this.page.getByRole('alert').filter({ hasText: message }).first()).toBeVisible({
            timeout: DEFAULT_TIMEOUT,
        });
    }

    /** A transient toast (sonner) with the given text. */
    async expectToast(message: string | RegExp) {
        await expect(this.page.getByText(message).first()).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    }

    /**
     * Verifies the /ticket-created confirmation page and returns the generated
     * Service Case reference (Ticket ID) shown to the user.
     */
    async expectSubmissionConfirmed(email: string): Promise<string> {
        await expect(this.page).toHaveURL(/\/ticket-created\?/, { timeout: 20_000 });
        await expect(this.page.getByRole('heading', { name: 'Support Ticket Created' })).toBeVisible();

        const ticketIdLine = this.page.getByText(/Ticket ID:\s*\d+/);
        await expect(ticketIdLine).toBeVisible();

        await expect(this.page.getByText('Track Progress')).toBeVisible();
        await expect(
            this.page.getByText(`A summary with this link has been sent to ${email}.`),
        ).toBeVisible();
        await expect(this.page.getByRole('button', { name: 'Create New Support Ticket' })).toBeVisible();

        const text = (await ticketIdLine.textContent()) ?? '';
        return text.replace(/\D/g, '');
    }
}
