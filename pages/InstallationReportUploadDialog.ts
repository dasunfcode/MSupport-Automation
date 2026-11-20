import { Page, Locator, Request, expect } from '@playwright/test';
import { InstallationReportDialog } from './InstallationReportDialog';

const DEFAULT_TIMEOUT = 15_000;
// Uploading and filing go through QA file storage; the server alone has taken 30 s+ to answer.
const STORAGE_RESPONSE_TIMEOUT = 90_000;
const T = 'commissioning-upload-installation_report';

const UPLOAD_API = /\/commissioning\/installation_report\/upload$/;

/** File payload accepted by `setInputFiles` / `FileChooser.setFiles`. */
export type UploadFile = string | { name: string; mimeType: string; buffer: Buffer };

/** Text the story requires in the "Not signed yet?" hint. */
export const NOT_SIGNED_HINT_TEXT =
    'An unsigned report cannot finalize the machine setup. Upload the signed copy once you have it — or fill out the report online, where the customer can sign on your device or later by e-mail.';
export const SIGNED_CONFIRMATION_LABEL = 'The report is signed by the customer and the service engineer';

/**
 * "Upload the installation report" dialog, opened from Asset Management →
 * Asset Info → Documents → Installation Report box → "Upload scan or photos"
 * (or "Replace with scan or photos" once a report is on file).
 *
 * Reuses `InstallationReportDialog` for the side panel (Documents tab,
 * Installation Report box, Machine setup strip) and the API cleanup.
 */
export class InstallationReportUploadDialog {
    readonly report: InstallationReportDialog;

    // ---- Installation Report box ------------------------------------------
    readonly uploadScanButton: Locator;
    readonly reportFileRows: Locator;
    readonly previousVersionsToggle: Locator;
    readonly previousVersions: Locator;

    // ---- Dialog -------------------------------------------------------------
    readonly dialog: Locator;
    readonly title: Locator;
    readonly dropzone: Locator;
    readonly fileInput: Locator;
    readonly chooseFileButton: Locator;
    readonly takePhotosButton: Locator;
    readonly addPageButton: Locator;
    readonly selectedFiles: Locator;
    readonly photoPages: Locator;
    readonly installationDate: Locator;
    readonly endCustomer: Locator;
    readonly notSignedHint: Locator;
    readonly fillOutOnlineLink: Locator;
    readonly signedConfirmation: Locator;
    readonly signedCheckbox: Locator;
    readonly cancelButton: Locator;
    readonly uploadButton: Locator;
    readonly closeButton: Locator;

    // ---- Replace confirmation ----------------------------------------------
    readonly replaceDialog: Locator;
    readonly replaceButton: Locator;
    readonly replaceDraftDialog: Locator;
    readonly discardDraftAndUploadButton: Locator;

    constructor(readonly page: Page) {
        this.report = new InstallationReportDialog(page);
        const card = this.report.reportCard;

        this.uploadScanButton = this.report.sidePanel.getByTestId('commissioning-card-installation_report-upload-scan');
        this.reportFileRows = card.getByTestId('commissioning-card-installation_report-files').getByRole('listitem');
        this.previousVersionsToggle = card.getByTestId('commissioning-card-installation_report-versions-toggle');
        this.previousVersions = card.getByTestId('commissioning-card-installation_report-versions');

        this.dialog = page.getByTestId(T);
        this.title = this.dialog.getByRole('heading', { name: 'Upload the installation report', level: 2 });
        this.dropzone = this.dialog.getByTestId(`${T}-picker-dropzone`);
        this.fileInput = this.dropzone.locator('input[type=file]');
        this.chooseFileButton = this.dialog.getByTestId(`${T}-picker-choose-file`);
        this.takePhotosButton = this.dialog.getByTestId(`${T}-picker-take-photos`);
        this.addPageButton = this.dialog.getByTestId(`${T}-picker-add-page`);
        this.selectedFiles = this.dialog.getByTestId(`${T}-picker-files`).locator(`[data-testid^="${T}-picker-file-"]:not([data-testid$="-remove"])`);
        this.photoPages = this.dialog.getByTestId(`${T}-picker-pages`).locator(`[data-testid^="${T}-picker-page-"]:not([data-testid$="-remove"])`);
        this.installationDate = this.dialog.getByTestId(`${T}-installation-date`).getByRole('textbox');
        this.endCustomer = this.dialog.getByTestId(`${T}-end-customer`);
        this.notSignedHint = this.dialog.getByTestId(`${T}-not-signed-hint`);
        this.fillOutOnlineLink = this.dialog.getByTestId(`${T}-fill-out-online`);
        this.signedConfirmation = this.dialog.getByTestId(`${T}-signed-confirmation`);
        this.signedCheckbox = this.dialog.getByTestId(`${T}-signed-checkbox`);
        this.cancelButton = this.dialog.getByTestId(`${T}-cancel`);
        this.uploadButton = this.dialog.getByTestId(`${T}-submit`);
        this.closeButton = this.dialog.getByRole('button', { name: 'Close' });

        this.replaceDialog = page.getByRole('dialog', { name: 'Replace the installation report?' });
        this.replaceButton = this.replaceDialog.getByRole('button', { name: 'Replace', exact: true });
        this.replaceDraftDialog = page.getByRole('dialog', { name: 'Replace the online draft?' });
        this.discardDraftAndUploadButton = this.replaceDraftDialog.getByRole('button', { name: 'Discard draft and upload' });
    }

    // ======================================================================
    // Navigation
    // ======================================================================

    async openAssetDocuments(serial: string) {
        await this.report.openAssetDocuments(serial);
    }

    /** Click "Upload scan or photos" (or "Replace with scan or photos") in the Installation Report box. */
    async openDialog() {
        await this.uploadScanButton.click();
        await expect(this.dialog).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(this.title).toBeVisible();
    }

    async openDialogForAsset(serial: string) {
        await this.openAssetDocuments(serial);
        await this.openDialog();
    }

    // ======================================================================
    // Cleanup (API, same cookie session as the browser)
    // ======================================================================

    private assetUrl() {
        if (!this.report.assetId) throw new Error('Open the asset first so its id is known');
        return `/api/v1/assets/${this.report.assetId}`;
    }

    /**
     * Return the test asset to its baseline: no installation report (nor
     * draft / versions), no installation date and no general documents.
     * The upload dialog writes the installation date onto the asset, so the
     * report reset alone is not enough.
     */
    async resetAsset(serial: string) {
        await this.report.resetReport(serial);
        const res = await this.page.request.patch(this.assetUrl(), { data: { installationDate: null, files: [] } });
        expect(res.ok(), `PATCH asset failed: ${res.status()} ${await res.text()}`).toBeTruthy();

        for (const doc of await this.additionalDocuments()) {
            const id = doc.documentId ?? doc.additionalCommissioningDocumentId ?? doc.id;
            const del = await this.page.request.delete(`${this.assetUrl()}/additional-commissioning-documents/${id}`);
            expect(del.ok(), `DELETE additional document failed: ${del.status()} ${await del.text()}`).toBeTruthy();
        }

        const asset = (await (await this.page.request.get(this.assetUrl())).json()).data;
        expect(asset.installationDate ?? null, 'Installation date should be cleared').toBeNull();
        expect(asset.files, 'No general asset documents should remain').toHaveLength(0);
        expect(await this.additionalDocuments(), 'No additional commissioning documents should remain').toHaveLength(0);
    }

    private async additionalDocuments(): Promise<any[]> {
        const res = await this.page.request.get(`${this.assetUrl()}/additional-commissioning-documents`);
        expect(res.ok(), `GET additional documents failed: ${res.status()}`).toBeTruthy();
        return (await res.json()).data;
    }

    private async asset(): Promise<any> {
        return (await (await this.page.request.get(this.assetUrl())).json()).data;
    }

    /** Installation date currently stored on the asset (null when not set). */
    async assetInstallationDate(): Promise<string | null> {
        return (await this.asset()).installationDate ?? null;
    }

    /** Company name of the end customer assigned on the asset. */
    async assetEndCustomer(): Promise<string> {
        return (await this.asset()).endCustomerOrg.companyName;
    }

    // ======================================================================
    // Actions
    // ======================================================================

    /** "Choose file": opens the native file browser, then picks `files`. */
    async chooseFile(files: UploadFile | UploadFile[]) {
        const chooser = this.page.waitForEvent('filechooser');
        await this.chooseFileButton.click();
        await (await chooser).setFiles(files as any);
    }

    /** "Take photos" (camera capture input): each picked image becomes one page. */
    async takePhotos(photos: UploadFile | UploadFile[]) {
        const chooser = this.page.waitForEvent('filechooser');
        await this.takePhotosButton.click();
        await (await chooser).setFiles(photos as any);
    }

    async addPage(photo: UploadFile) {
        const chooser = this.page.waitForEvent('filechooser');
        await this.addPageButton.click();
        await (await chooser).setFiles(photo as any);
    }

    /** Add a file straight to the hidden input, bypassing the picker buttons. */
    async addFileDirectly(file: UploadFile) {
        await this.fileInput.setInputFiles(file as any);
    }

    /** Drag a file from "outside the browser" and drop it onto the drop area. */
    async dropFile(name: string, mimeType: string, content: string) {
        const dataTransfer = await this.page.evaluateHandle(({ name, mimeType, content }) => {
            const dt = new DataTransfer();
            dt.items.add(new File([content], name, { type: mimeType }));
            return dt;
        }, { name, mimeType, content });
        await this.dropzone.dispatchEvent('dragenter', { dataTransfer });
        await this.dropzone.dispatchEvent('dragover', { dataTransfer });
        await this.dropzone.dispatchEvent('drop', { dataTransfer });
    }

    removeButton(name: string) {
        return this.dialog.getByRole('button', { name: `Remove ${name}`, exact: true });
    }

    async removeFile(name: string) {
        await this.removeButton(name).click();
        await expect(this.removeButton(name)).toHaveCount(0);
    }

    /** Remove every selected file / photographed page. */
    async removeAll() {
        const remove = this.dialog.getByRole('button', { name: /^Remove / });
        while (await remove.count()) {
            const before = await remove.count();
            await remove.first().click();
            await expect(remove).toHaveCount(before - 1);
        }
    }

    /** Tick / untick the signature confirmation (the input is sr-only, so its label is clicked). */
    async setSigned(checked: boolean) {
        if ((await this.signedCheckbox.isChecked()) !== checked) await this.signedConfirmation.click();
        await expect(this.signedCheckbox).toBeChecked({ checked });
    }

    /**
     * The dialog currently asks for the installation date while the asset has
     * none. Fill today's date if the field is present, in the field's own
     * placeholder order (mm/dd/yyyy or dd/mm/yyyy).
     */
    async fillInstallationDateIfAsked() {
        if (!(await this.installationDate.isVisible())) return;
        const placeholder = (await this.installationDate.getAttribute('placeholder')) ?? 'mm/dd/yyyy';
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const digits = placeholder.toLowerCase().startsWith('dd') ? `${dd}${mm}${now.getFullYear()}` : `${mm}${dd}${now.getFullYear()}`;
        await this.installationDate.click();
        await this.installationDate.pressSequentially(digits);
        await expect(this.installationDate).toHaveValue(/\d{2}\/\d{2}\/\d{4}/);
    }

    /** Confirm the signature (and fill the installation date if asked) so the report can be uploaded. */
    async prepareForUpload() {
        await this.fillInstallationDateIfAsked();
        await this.setSigned(true);
        await expect(this.uploadButton).toBeEnabled();
    }

    /** Click "Upload Report" and return the upload request once it is sent. */
    async clickUpload(): Promise<Request> {
        const request = this.page.waitForRequest(r => UPLOAD_API.test(r.url()) && r.method() === 'POST', { timeout: STORAGE_RESPONSE_TIMEOUT });
        await this.uploadButton.click();
        return request;
    }

    /** Upload a first report (no confirmation step). */
    async uploadReport(): Promise<Request> {
        const response = this.page.waitForResponse(r => UPLOAD_API.test(r.url()) && r.request().method() === 'POST', { timeout: STORAGE_RESPONSE_TIMEOUT });
        const request = await this.clickUpload();
        expect((await response).ok(), 'Upload request should succeed').toBeTruthy();
        await expect(this.dialog).toBeHidden({ timeout: DEFAULT_TIMEOUT });
        return request;
    }

    /**
     * Click "Upload Report", expect `confirmDialog` (showing `explanation`)
     * before anything is sent, confirm with `confirmButton`, and return the
     * upload request.
     */
    private async uploadAfterConfirmation(confirmDialog: Locator, confirmButton: Locator, explanation: string): Promise<Request> {
        let sentEarly = false;
        const early = (r: Request) => { if (UPLOAD_API.test(r.url())) sentEarly = true; };
        this.page.on('request', early);
        await this.uploadButton.click();
        await expect(confirmDialog).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(confirmDialog).toContainText(explanation);
        this.page.off('request', early);
        expect(sentEarly, 'Nothing may be uploaded before the confirmation').toBeFalsy();

        const response = this.page.waitForResponse(r => UPLOAD_API.test(r.url()) && r.request().method() === 'POST', { timeout: STORAGE_RESPONSE_TIMEOUT });
        await confirmButton.click();
        const res = await response;
        expect(res.ok(), 'Upload request should succeed').toBeTruthy();
        await expect(this.dialog).toBeHidden({ timeout: DEFAULT_TIMEOUT });
        return res.request();
    }

    /** Upload over an existing report: "Replace the installation report?" must be confirmed first. */
    async uploadReplacement(): Promise<Request> {
        return this.uploadAfterConfirmation(this.replaceDialog, this.replaceButton,
            'The report on file moves to the previous versions and stays available there.');
    }

    /** Upload while an online draft exists: "Replace the online draft?" must be confirmed first. */
    async uploadDiscardingDraft(): Promise<Request> {
        return this.uploadAfterConfirmation(this.replaceDraftDialog, this.discardDraftAndUploadButton,
            'Uploading the signed paper report discards the draft.');
    }

    async cancel() {
        await this.cancelButton.click();
        await expect(this.dialog).toBeHidden();
    }

    /** Answer the next upload request with an error without letting it reach the server. */
    async failNextUpload(status = 500) {
        await this.page.route(UPLOAD_API, route => route.fulfill({
            status, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Stubbed failure' }),
        }), { times: 1 });
    }

    /** Make the next upload request time out (network abort). */
    async timeoutNextUpload() {
        await this.page.route(UPLOAD_API, route => route.abort('timedout'), { times: 1 });
    }

    /**
     * Upload a file through the "Additional commissioning documents" box
     * (the "other documents" of the commissioning), so the Documents tab has
     * a reference row to compare the report row against.
     */
    async addAdditionalDocument(file: UploadFile) {
        const panel = this.report.sidePanel;
        await panel.getByTestId('additional-commissioning-documents-card-upload').click();
        const dialog = this.page.getByTestId('additional-commissioning-documents-upload');
        await expect(dialog).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await dialog.getByTestId('additional-commissioning-documents-upload-picker-dropzone').locator('input[type=file]').setInputFiles(file as any);

        const saved = this.page.waitForResponse(r => /\/additional-commissioning-documents$/.test(r.url()) && r.request().method() === 'POST', { timeout: STORAGE_RESPONSE_TIMEOUT });
        await dialog.getByTestId('additional-commissioning-documents-upload-submit').click();
        expect((await saved).ok(), 'Additional document upload should succeed').toBeTruthy();
        await expect(dialog).toBeHidden({ timeout: DEFAULT_TIMEOUT });
    }

    /** A row of the "Additional commissioning documents" box. */
    additionalDocumentRow(fileName: string) {
        return this.report.sidePanel
            .getByTestId('additional-commissioning-documents-card-files')
            .getByRole('listitem')
            .filter({ hasText: fileName });
    }

    reportFileRow(fileName: string) {
        return this.reportFileRows.filter({ hasText: fileName });
    }

    // ======================================================================
    // Assertions
    // ======================================================================

    async expectEmptyDropArea() {
        await expect(this.dropzone).toBeVisible();
        await expect(this.dropzone).toContainText('Drop a PDF scan or photos here');
        await expect(this.chooseFileButton).toBeVisible();
        await expect(this.takePhotosButton).toBeVisible();
    }

    async expectAcceptedFormatsAndSize() {
        await expect(this.dropzone).toContainText('PDF, JPG, PNG · up to 12 MB');
        await expect(this.fileInput).toHaveAttribute('accept', /application\/pdf.*image\/jpeg.*image\/png/);
    }

    /**
     * While the asset has no installation date, the dialog asks for it
     * (mandatory) and shows the asset's end customer read-only.
     */
    async expectInstallationDateAndEndCustomerFields(endCustomer: string | RegExp) {
        const dateField = this.dialog.getByTestId(`${T}-installation-date`);
        await expect(dateField).toContainText('Installation date *');
        await expect(dateField).toContainText('Not on the paper form - enter it here');
        await expect(this.installationDate).toBeEditable();
        await expect(this.installationDate).toHaveValue(/^[_/]*$/);
        await expect(this.endCustomer).toBeDisabled();
        await expect(this.endCustomer).toHaveValue(endCustomer);
        await expect(this.dialog).toContainText('Assigned on the asset.');
    }

    async expectSelectedFile(name: string, size: string | RegExp) {
        const row = this.selectedFiles.filter({ hasText: name });
        await expect(row).toHaveCount(1);
        await expect(row).toContainText(size);
        await expect(this.removeButton(name)).toBeVisible();
    }

    async expectPages(count: number) {
        await expect(this.photoPages).toHaveCount(count);
        for (let i = 1; i <= count; i++) {
            await expect(this.photoPages.nth(i - 1)).toContainText(`Page ${i}`);
            await expect(this.removeButton(`Page ${i}`)).toBeVisible();
        }
        await expect(this.addPageButton).toBeVisible();
    }

    async expectNotSignedHint() {
        await expect(this.notSignedHint).toBeVisible();
        await expect(this.notSignedHint.getByText('Not signed yet?', { exact: true })).toBeVisible();
        await expect(this.notSignedHint).toContainText(NOT_SIGNED_HINT_TEXT);
        await expect(this.fillOutOnlineLink).toHaveText('fill out the report online');
    }

    async expectSignedConfirmation() {
        await expect(this.signedConfirmation).toBeVisible();
        await expect(this.signedConfirmation).toContainText(SIGNED_CONFIRMATION_LABEL);
        await expect(this.signedConfirmation).toContainText('*'); // mandatory marker
        await expect(this.signedCheckbox).not.toBeChecked();
    }

    async expectUploadDisabled() {
        await expect(this.uploadButton).toBeDisabled();
    }

    async expectFileRejected(name: string) {
        await this.report.expectToast(`${name} was not added. Only PDF, JPG or PNG files up to 12 MB are accepted.`);
        await expect(this.removeButton(name)).toHaveCount(0);
        await this.expectEmptyDropArea();
    }

    async expectReportOnFile(fileName: string) {
        await expect(this.report.reportCard).toContainText('On file');
        await expect(this.reportFileRow(fileName)).toHaveCount(1);
        await expect(this.reportFileRows).toHaveCount(1);
        await expect(this.report.setupStep('installation_report')).not.toContainText('not done yet');
        // Only one report per asset: the box now offers replacing instead of uploading.
        await expect(this.uploadScanButton).toHaveText(/Replace with scan or photos/);
    }

    /**
     * Compare a file row by its building blocks: tag selector and the actions
     * offered (file name stripped from the accessible names so two rows for
     * different files compare equal). Thumbnails are left out: they only exist
     * when the backend could render one for the file.
     */
    async rowDesign(row: Locator, fileName: string) {
        return row.evaluate((el, name) => {
            const strip = (s: string) => s.replace(name, '').trim();
            return {
                tagSelector: !!el.querySelector('[role="combobox"]'),
                actions: [...el.querySelectorAll('button:not([role="combobox"])')]
                    .map(b => strip(b.getAttribute('aria-label') || (b as HTMLElement).innerText)),
            };
        }, fileName);
    }
}
