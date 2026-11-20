import { Page, Locator, Request, expect } from '@playwright/test';
import { CommissioningChecklistDialog } from './CommissioningChecklistDialog';
import type { UploadFile } from './InstallationReportUploadDialog';

const DEFAULT_TIMEOUT = 15_000;
// Uploading and filing go through QA file storage; the server alone has taken 30 s+ to answer.
const STORAGE_RESPONSE_TIMEOUT = 90_000;
const T = 'commissioning-upload-commissioning_checklist';
const UPLOAD_API = /\/commissioning\/commissioning_checklist\/upload$/;

/**
 * "Upload the commissioning checklist" dialog, opened from the Commissioning
 * Checklist box → "Upload scan or photos" (or "Replace with scan or photos"
 * once a checklist is on file).
 */
export class CommissioningChecklistUploadDialog {
    readonly checklist: CommissioningChecklistDialog;

    readonly dialog: Locator;
    readonly title: Locator;
    readonly dropzone: Locator;
    readonly fileInput: Locator;
    readonly chooseFileButton: Locator;
    readonly takePhotosButton: Locator;
    readonly addPageButton: Locator;
    readonly selectedFiles: Locator;
    readonly photoPages: Locator;
    readonly cancelButton: Locator;
    readonly uploadButton: Locator;

    readonly replaceDialog: Locator;
    readonly replaceButton: Locator;

    constructor(readonly page: Page) {
        this.checklist = new CommissioningChecklistDialog(page);

        this.dialog = page.getByTestId(T);
        this.title = this.dialog.getByRole('heading', { name: 'Upload the commissioning checklist', level: 2 });
        this.dropzone = this.dialog.getByTestId(`${T}-picker-dropzone`);
        this.fileInput = this.dropzone.locator('input[type=file]');
        this.chooseFileButton = this.dialog.getByTestId(`${T}-picker-choose-file`);
        this.takePhotosButton = this.dialog.getByTestId(`${T}-picker-take-photos`);
        this.addPageButton = this.dialog.getByTestId(`${T}-picker-add-page`);
        this.selectedFiles = this.dialog.getByTestId(`${T}-picker-files`).locator(`[data-testid^="${T}-picker-file-"]:not([data-testid$="-remove"])`);
        this.photoPages = this.dialog.getByTestId(`${T}-picker-pages`).locator(`[data-testid^="${T}-picker-page-"]:not([data-testid$="-remove"])`);
        this.cancelButton = this.dialog.getByTestId(`${T}-cancel`);
        this.uploadButton = this.dialog.getByTestId(`${T}-submit`);

        this.replaceDialog = page.getByRole('dialog', { name: 'Replace the commissioning checklist?' });
        this.replaceButton = this.replaceDialog.getByRole('button', { name: 'Replace', exact: true });
    }

    // ======================================================================
    // Navigation
    // ======================================================================

    async openDialog() {
        await this.checklist.uploadScanButton.click();
        await expect(this.dialog).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(this.title).toBeVisible();
    }

    async openDialogForAsset(serial: string) {
        await this.checklist.openAssetDocuments(serial);
        await this.openDialog();
    }

    // ======================================================================
    // Actions
    // ======================================================================

    async chooseFile(files: UploadFile | UploadFile[]) {
        const chooser = this.page.waitForEvent('filechooser');
        await this.chooseFileButton.click();
        await (await chooser).setFiles(files as any);
    }

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

    /** Click "Upload checklist" and return the upload request once it is sent. */
    async clickUpload(): Promise<Request> {
        const request = this.page.waitForRequest(r => UPLOAD_API.test(r.url()) && r.method() === 'POST', { timeout: STORAGE_RESPONSE_TIMEOUT });
        await this.uploadButton.click();
        return request;
    }

    /** Upload while no checklist is on file (no confirmation step). */
    async upload(): Promise<Request> {
        const response = this.page.waitForResponse(r => UPLOAD_API.test(r.url()) && r.request().method() === 'POST', { timeout: STORAGE_RESPONSE_TIMEOUT });
        const request = await this.clickUpload();
        expect((await response).ok(), 'Upload request should succeed').toBeTruthy();
        await expect(this.dialog).toBeHidden({ timeout: DEFAULT_TIMEOUT });
        return request;
    }

    /** Upload over a filed checklist: "Replace the commissioning checklist?" must be confirmed first. */
    async uploadReplacement(): Promise<Request> {
        let sentEarly = false;
        const early = (r: Request) => { if (UPLOAD_API.test(r.url())) sentEarly = true; };
        this.page.on('request', early);
        await this.uploadButton.click();
        await expect(this.replaceDialog).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(this.replaceDialog).toContainText('The checklist on file moves to the previous versions and stays available there.');
        this.page.off('request', early);
        expect(sentEarly, 'Nothing may be uploaded before the confirmation').toBeFalsy();

        const response = this.page.waitForResponse(r => UPLOAD_API.test(r.url()) && r.request().method() === 'POST', { timeout: STORAGE_RESPONSE_TIMEOUT });
        await this.replaceButton.click();
        const res = await response;
        expect(res.ok(), 'Upload request should succeed').toBeTruthy();
        await expect(this.dialog).toBeHidden({ timeout: DEFAULT_TIMEOUT });
        return res.request();
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

    async expectUploadDisabled() {
        await expect(this.uploadButton).toBeDisabled();
    }

    async expectFileRejected(name: string) {
        await this.checklist.report.expectToast(`${name} was not added. Only PDF, JPG or PNG files up to 12 MB are accepted.`);
        await expect(this.removeButton(name)).toHaveCount(0);
        await this.expectEmptyDropArea();
        await this.expectUploadDisabled();
    }

    /** Uploaded: On file, one file row, replacing instead of uploading. */
    async expectUploadedOnFile(fileName: string) {
        await this.checklist.expectTag('On file');
        await this.checklist.expectFileRow(fileName);
        await expect(this.checklist.fileRows).toHaveCount(1);
        await expect(this.checklist.uploadScanButton).toHaveText(/Replace with scan or photos/);
        await expect(this.checklist.card.getByRole('button', { name: /Fill out online/ })).toHaveCount(0);
    }
}
