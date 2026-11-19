import { readFileSync } from 'fs';
import { Browser } from '@playwright/test';
import { test, expect } from '../fixtures/fixtures';
import { InstallationReportUploadDialog } from '../pages/InstallationReportUploadDialog';

// ==================== EASY-TO-CHANGE TEST DATA ====================
// Dedicated test machine (shared with installation-report-online.spec.ts).
// An asset holds only one installation report, so the suite resets the asset
// (report, versions, installation date, documents) before and after the run.
const assetSerial = 'MPR01227';
const RUN_ID = Date.now();

// MSUPPORT does not read the file content, so a tiny sample PDF stands in for a scan.
const SIGNED_PDF = 'data/uploads/installation-report-signed.pdf';
const SIGNED_PDF_NAME = 'installation-report-signed.pdf';
const REPLACEMENT_PDF = { name: `replacement-${RUN_ID}.pdf`, mimeType: 'application/pdf', buffer: readFileSync(SIGNED_PDF) };
const OTHER_DOCUMENT = { name: `other-document-${RUN_ID}.pdf`, mimeType: 'application/pdf', buffer: readFileSync(SIGNED_PDF) };
const UNSUPPORTED_FILE = 'data/uploads/unsupported.txt';

// 1x1 PNG, used as a "photographed page".
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');
const photo = (n: number) => ({ name: `page-${n}.png`, mimeType: 'image/png', buffer: PNG });

const MB = 1024 * 1024;
const pdfOfSize = (name: string, bytes: number) => ({ name, mimeType: 'application/pdf', buffer: Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(bytes - 9, 0x20)]) });
// The app's limit is 12 MB (agreed over the story's 20 MB).
const TOO_LARGE_PDF = pdfOfSize('too-large-13mb.pdf', 13 * MB);
const LARGE_ALLOWED_PDF = pdfOfSize('large-11mb.pdf', 11 * MB);
// Minimal ISO-BMFF header with the "heic" brand.
const HEIC_PHOTO = { name: 'page.heic', mimeType: 'image/heic', buffer: Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypheic\0\0\0\0mif1heic')]) };

// Where the story and the live app differ, the app is the agreed reference
// (12 MB / no HEIC, date + end customer in the dialog, no form-name text,
// report rows styled like the Additional commissioning documents rows),
// except for the rule below. Its test keeps the story's assertion and is
// marked `test.fail` until the app is fixed; Playwright then flags it as an
// unexpected pass and the marker must be removed.
const KNOWN_GAP = {
    notTaggedCommissioning: 'Uploaded report does not appear in the document list tagged Commissioning',
};

/** Reset the test asset in its own browser context (hooks have no test-scoped page). */
async function resetTestAsset(browser: Browser) {
    const context = await browser.newContext({
        baseURL: process.env.BASE_URL,
        storageState: process.env.AUTH_JSON_PATH || 'auth.json',
        ignoreHTTPSErrors: true,
    });
    try {
        await new InstallationReportUploadDialog(await context.newPage()).resetAsset(assetSerial);
    } finally {
        await context.close();
    }
}

test.describe.serial('Installation Report - Upload', () => {

    test.beforeAll(async ({ browser }) => {
        await resetTestAsset(browser);
    });

    // Serial mode skips the remaining tests after a failure, so cleanup lives in
    // afterAll: it always runs and removes whatever the run uploaded.
    test.afterAll(async ({ browser }) => {
        await resetTestAsset(browser);
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC000_Test asset starts without an installation report', async ({ installationReportUpload }) => {
        await installationReportUpload.openAssetDocuments(assetSerial);
        await installationReportUpload.report.expectReportMissing();
        await expect(installationReportUpload.uploadScanButton).toHaveText(/Upload scan or photos/);
    });

    // ---- File selection ----------------------------------------------------

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC001a_Upload scan or photos opens the Upload the installation report dialog', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.expectEmptyDropArea();
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC001c_Drop area offers Choose file and Take photos and names formats and maximum size', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.expectEmptyDropArea();
        await installationReportUpload.expectAcceptedFormatsAndSize();
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC001d_Choose file opens the file browser and adds the chosen file', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.chooseFile(SIGNED_PDF);
        await installationReportUpload.expectSelectedFile(SIGNED_PDF_NAME, /\d+ KB/);
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC001e_A file can be added by dragging it onto the drop area', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.dropFile('dropped-scan.pdf', 'application/pdf', '%PDF-1.4\n% dropped\n%%EOF\n');
        await installationReportUpload.expectSelectedFile('dropped-scan.pdf', /\d+ KB/);
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC001f_Selected file shows name and size and can be removed again', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.chooseFile(SIGNED_PDF);
        await installationReportUpload.expectSelectedFile(SIGNED_PDF_NAME, '1 KB');
        await installationReportUpload.removeFile(SIGNED_PDF_NAME);
        await installationReportUpload.expectEmptyDropArea();
        await installationReportUpload.expectUploadDisabled();
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC001g_Taken photos are listed page by page and further pages can be added', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.takePhotos(photo(1));
        await installationReportUpload.expectPages(1);
        await installationReportUpload.addPage(photo(2));
        await installationReportUpload.expectPages(2);
        await installationReportUpload.addPage(photo(3));
        await installationReportUpload.expectPages(3);
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC001h_Removing all photos again returns to the empty drop area', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.takePhotos([photo(1), photo(2)]);
        await installationReportUpload.expectPages(2);
        await installationReportUpload.removeAll();
        await installationReportUpload.expectEmptyDropArea();
        await expect(installationReportUpload.signedConfirmation).toBeHidden();
        await installationReportUpload.expectUploadDisabled();
    });

    // ---- Signature confirmation --------------------------------------------

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC002a_Mandatory signature checkbox appears only after a file is added', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await expect(installationReportUpload.signedConfirmation).toBeHidden();
        await installationReportUpload.chooseFile(SIGNED_PDF);
        await installationReportUpload.expectSignedConfirmation();
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC002b_Not signed yet hint is shown while the checkbox is not ticked', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.chooseFile(SIGNED_PDF);
        await installationReportUpload.expectNotSignedHint();
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC002c_Fill out the report online link opens the online Installation Report form', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.chooseFile(SIGNED_PDF);
        await installationReportUpload.fillOutOnlineLink.click();
        await expect(installationReportUpload.report.dialog).toBeVisible();
        await expect(installationReportUpload.report.title).toBeVisible();
        await expect(installationReportUpload.dialog).toBeHidden();
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC002d_Hint disappears once the checkbox is ticked', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.chooseFile(SIGNED_PDF);
        await installationReportUpload.expectNotSignedHint();
        await installationReportUpload.setSigned(true);
        await expect(installationReportUpload.notSignedHint).toBeHidden();
        await installationReportUpload.setSigned(false);
        await installationReportUpload.expectNotSignedHint();
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC002e_Upload Report stays disabled until a file is selected and the checkbox is ticked', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.expectUploadDisabled();                 // nothing selected

        await installationReportUpload.chooseFile(SIGNED_PDF);
        await installationReportUpload.fillInstallationDateIfAsked();
        await installationReportUpload.expectUploadDisabled();                 // file, not ticked

        await installationReportUpload.setSigned(true);
        await expect(installationReportUpload.uploadButton).toBeEnabled();     // file + ticked

        await installationReportUpload.setSigned(false);
        await installationReportUpload.expectUploadDisabled();                 // unticked again

        await installationReportUpload.setSigned(true);
        await installationReportUpload.removeFile(SIGNED_PDF_NAME);
        await installationReportUpload.expectUploadDisabled();                 // file removed
    });

    // ---- Business rules and exceptional cases (nothing is filed) -----------

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC003a_Unsupported file type is rejected with a message', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.chooseFile(UNSUPPORTED_FILE);
        await installationReportUpload.expectFileRejected('unsupported.txt');
        await installationReportUpload.expectUploadDisabled();
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC003b_File larger than 12 MB is rejected with a message', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.chooseFile(TOO_LARGE_PDF);
        await installationReportUpload.expectFileRejected(TOO_LARGE_PDF.name);
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC003c_PDF up to 12 MB is accepted', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.chooseFile(LARGE_ALLOWED_PDF);
        await installationReportUpload.expectSelectedFile(LARGE_ALLOWED_PDF.name, /11(\.\d+)? MB/);
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC003d_HEIC photo is rejected with a message', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.chooseFile(HEIC_PHOTO);
        await installationReportUpload.expectFileRejected(HEIC_PHOTO.name);
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC003e_Asset without installation date - dialog asks for it (mandatory) and shows the end customer read-only', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        expect(await installationReportUpload.assetInstallationDate()).toBeNull();
        const endCustomer = await installationReportUpload.assetEndCustomer();

        await installationReportUpload.chooseFile(SIGNED_PDF);
        await installationReportUpload.expectInstallationDateAndEndCustomerFields(endCustomer);

        // Mandatory: file + signature confirmation alone are not enough.
        await installationReportUpload.setSigned(true);
        await installationReportUpload.expectUploadDisabled();
        await installationReportUpload.fillInstallationDateIfAsked();
        await expect(installationReportUpload.uploadButton).toBeEnabled();
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC003f_Cancel discards the upload', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.chooseFile(SIGNED_PDF);
        await installationReportUpload.prepareForUpload();
        await installationReportUpload.cancel();

        await installationReportUpload.report.expectReportMissing();
        expect((await installationReportUpload.report.reportState()).status).toBe('missing');

        await installationReportUpload.openDialog();
        await installationReportUpload.expectEmptyDropArea();
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC003g_Failed upload keeps the dialog open with an error and files nothing', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.chooseFile(SIGNED_PDF);
        await installationReportUpload.prepareForUpload();
        await installationReportUpload.failNextUpload(500);
        await installationReportUpload.clickUpload();

        await installationReportUpload.report.expectToast();
        await expect(installationReportUpload.dialog).toBeVisible();
        await installationReportUpload.expectSelectedFile(SIGNED_PDF_NAME, '1 KB');
        expect((await installationReportUpload.report.reportState()).status).toBe('missing');
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC003h_Upload that times out keeps the dialog open with an error and files nothing', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.chooseFile(SIGNED_PDF);
        await installationReportUpload.prepareForUpload();
        await installationReportUpload.timeoutNextUpload();
        await installationReportUpload.clickUpload();

        await installationReportUpload.report.expectToast();
        await expect(installationReportUpload.dialog).toBeVisible();
        await expect(installationReportUpload.uploadButton).toBeEnabled();
        expect((await installationReportUpload.report.reportState()).status).toBe('missing');
    });

    // ---- After uploading (files a report on the test asset) ----------------

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC004a_Uploaded photos are combined into one PDF, filed On file and the Machine setup strip updates', async ({ installationReportUpload }) => {
        await installationReportUpload.openAssetDocuments(assetSerial);
        const progressBefore = await installationReportUpload.report.setupProgress();

        await installationReportUpload.openDialog();
        await installationReportUpload.takePhotos(photo(1));
        await installationReportUpload.addPage(photo(2));
        await installationReportUpload.expectPages(2);
        await installationReportUpload.prepareForUpload();
        const request = await installationReportUpload.uploadReport();

        // Both pages travel as one PDF, with the signature confirmation.
        const body = request.postDataJSON();
        expect(body.signedConfirmed).toBe(true);
        expect(body.file.name).toMatch(/\.pdf$/i);

        await installationReportUpload.report.expectToast('Report uploaded and filed');
        const state = await installationReportUpload.report.reportState();
        expect(state.status).toBe('on_file');
        expect(state.files).toHaveLength(1);
        const filedName = (state.files[0] as { name: string }).name;
        expect(filedName).toMatch(/\.pdf$/i);

        await installationReportUpload.expectReportOnFile(filedName);
        // The date entered in the dialog is written onto the asset, completing that step too.
        expect(await installationReportUpload.assetInstallationDate()).not.toBeNull();
        await expect(installationReportUpload.report.setupStep('installation_date')).not.toContainText('not done yet');
        expect(await installationReportUpload.report.setupProgress()).toBeGreaterThan(progressBefore);
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC004b_Uploaded report is filed as a document tagged Commissioning', async ({ installationReportUpload }) => {
        test.fail(true, KNOWN_GAP.notTaggedCommissioning);
        await installationReportUpload.openAssetDocuments(assetSerial);
        const panel = installationReportUpload.report.sidePanel;
        await expect(panel.getByRole('button', { name: 'Commissioning', exact: true })).toBeVisible();
        await expect(panel.getByRole('heading', { name: 'Commissioning Documents', level: 3 })).toBeVisible();
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC004c_Report file row has the same design as the Additional commissioning documents rows', async ({ installationReportUpload }) => {
        await installationReportUpload.openAssetDocuments(assetSerial);
        const filedName = (installationReportUpload.report.reportState()).then(s => (s.files[0] as { name: string }).name);
        await installationReportUpload.addAdditionalDocument(OTHER_DOCUMENT);

        const otherRow = installationReportUpload.additionalDocumentRow(OTHER_DOCUMENT.name);
        await expect(otherRow).toBeVisible();
        const reportRow = installationReportUpload.reportFileRow(await filedName);
        await expect(reportRow).toBeVisible();

        expect(await installationReportUpload.rowDesign(reportRow, await filedName))
            .toEqual(await installationReportUpload.rowDesign(otherRow, OTHER_DOCUMENT.name));
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC004d_Only one report per asset - uploading again replaces it after confirmation and keeps the previous version', async ({ installationReportUpload }) => {
        await installationReportUpload.openAssetDocuments(assetSerial);
        const before = await installationReportUpload.report.reportState();
        const previousName = (before.files[0] as { name: string }).name;

        await installationReportUpload.openDialog();          // now "Replace with scan or photos"
        await installationReportUpload.chooseFile(REPLACEMENT_PDF);
        await expect(installationReportUpload.installationDate, 'Date is already on the asset, so it is not asked again').toHaveCount(0);
        await installationReportUpload.prepareForUpload();
        const request = await installationReportUpload.uploadReplacement();
        expect(request.postDataJSON().replace).toBe(true);

        await installationReportUpload.report.expectToast('Report replaced. The previous version is kept.');
        await installationReportUpload.expectReportOnFile(REPLACEMENT_PDF.name);
        await expect(installationReportUpload.reportFileRow(previousName)).toHaveCount(0);

        // Version history keeps the previous file.
        await expect(installationReportUpload.previousVersionsToggle).toHaveText(/Previous versions \(1\)/);
        await installationReportUpload.previousVersionsToggle.click();
        await expect(installationReportUpload.previousVersions).toContainText(previousName);

        const after = await installationReportUpload.report.reportState();
        expect(after.files).toHaveLength(1);
        expect(after.previousVersions).toHaveLength(1);
        expect(JSON.stringify(after.previousVersions[0])).toContain(previousName);
    });

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC004e_Closing the replacement confirmation keeps the report on file unchanged', async ({ installationReportUpload }) => {
        await installationReportUpload.openDialogForAsset(assetSerial);
        await installationReportUpload.chooseFile(SIGNED_PDF);
        await installationReportUpload.prepareForUpload();
        await installationReportUpload.uploadButton.click();
        await expect(installationReportUpload.replaceDialog).toBeVisible();
        await installationReportUpload.replaceDialog.getByRole('button', { name: 'Close' }).click();
        await expect(installationReportUpload.replaceDialog).toBeHidden();

        const state = await installationReportUpload.report.reportState();
        expect((state.files[0] as { name: string }).name).toBe(REPLACEMENT_PDF.name);
        expect(state.previousVersions).toHaveLength(1);
    });

    // ---- Draft of the online report exists ----------------------------------

    test('MSUP-INSTALLATION-REPORT-UPLOAD-TC005a_Uploading a scan while an online draft exists asks to discard the draft, then files the scan', async ({ installationReportUpload, browser }) => {
        await resetTestAsset(browser);
        const { report } = installationReportUpload;

        await report.openFormForAsset(assetSerial);
        await report.fillCustomerField('contact_person', `Draft contact ${RUN_ID}`);
        await report.saveDraft();
        expect((await report.reportState()).status).toBe('draft');

        await installationReportUpload.openAssetDocuments(assetSerial);
        await installationReportUpload.openDialog();
        await installationReportUpload.chooseFile(SIGNED_PDF);
        await installationReportUpload.prepareForUpload();
        await installationReportUpload.uploadDiscardingDraft();

        const state = await report.reportState();
        expect(state.status).toBe('on_file');
        expect((state as unknown as { source: string }).source).toBe('upload');
        await installationReportUpload.expectReportOnFile(SIGNED_PDF_NAME);
        await expect(report.reportCard.getByRole('button', { name: /Continue report|Discard draft/ })).toHaveCount(0);
    });

    // ---- Exceptional cases that need a second session / file corruption ----

    test.fixme('MSUP-INSTALLATION-REPORT-UPLOAD-TC006a_Another user files a report for the same asset while the dialog is open', async () => {
        // Needs a second login (createTicketPage-style worker fixture with other credentials)
        // that files a report mid-test; the expected outcome is not specified in the story.
    });

    test.fixme('MSUP-INSTALLATION-REPORT-UPLOAD-TC006b_Corrupted file is rejected', async () => {
        // MSUPPORT does not inspect file content, so a corrupted file cannot be detected client-side.
    });

});
