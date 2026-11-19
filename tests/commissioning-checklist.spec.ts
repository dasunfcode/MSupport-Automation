import { readFileSync } from 'fs';
import { Browser } from '@playwright/test';
import { test, expect } from '../fixtures/fixtures';
import { CommissioningChecklistDialog, ChecklistTemplate, tickable } from '../pages/CommissioningChecklistDialog';
import { LoginPage } from '../pages/LoginPage';

// ==================== EASY-TO-CHANGE TEST DATA ====================
// Dedicated test machine (shared with the installation-report specs, which do
// not touch the checklist). A machine holds one commissioning checklist, so the
// suite deletes it (draft, file, versions) before and after the run.
const assetSerial = 'MPR01227';
const MACHINE_TYPE = 'MPRINT';
const RUN_ID = Date.now();
const RUN_START = new Date().toISOString();

// Template points used by the scenarios ("section.key").
const SETUP = 'mprint_setup';
const TRAINING = 'training_documentation';
const FIRST_POINT = { section: SETUP, key: 'delivery_note' };
const SECOND_POINT = { section: SETUP, key: 'installation_surface' };
const THIRD_POINT = { section: SETUP, key: 'unpack_machine' };
const BOLD_POINT = { section: SETUP, key: 'pressure_regulators' };           // "MPRINT: …", "MPRINTpro: …"
const SUB_LINES_POINT = { section: 'system_configuration', key: 'remove_build_module' }; // warning + notes beneath
const LINKED_POINT = { section: TRAINING, key: 'cheatsheet_shown' };
const INFO_NOTE = { section: SETUP, key: 'inerting_hint' };
const NOT_APPLICABLE_ON_COMPLETE = [`${SETUP}.${SECOND_POINT.key}`];

// MSUPPORT does not read the file content, so a tiny sample PDF stands in for a scan.
const SCAN_PDF = 'data/uploads/installation-report-signed.pdf';
const SCAN_PDF_NAME = 'installation-report-signed.pdf';
const REPLACEMENT_PDF = { name: `checklist-scan-${RUN_ID}.pdf`, mimeType: 'application/pdf', buffer: readFileSync(SCAN_PDF) };
const UNSUPPORTED_FILE = 'data/uploads/unsupported.txt';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');
const photo = (n: number) => ({ name: `checklist-page-${n}.png`, mimeType: 'image/png', buffer: PNG });
const MB = 1024 * 1024;
const pdfOfSize = (name: string, bytes: number) => ({ name, mimeType: 'application/pdf', buffer: Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(bytes - 9, 0x20)]) });
// The app's limit is 12 MB without HEIC, the same agreed deviation from the
// story's "PDF, JPG, PNG, HEIC, up to 20 MB" as the installation report upload.
const TOO_LARGE_PDF = pdfOfSize('checklist-13mb.pdf', 13 * MB);
const HEIC_PHOTO = { name: 'checklist-page.heic', mimeType: 'image/heic', buffer: Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypheic\0\0\0\0mif1heic')]) };

// Optional read-only account for the "no edit rights" scenario.
const READONLY_EMAIL = process.env.READONLY_EMAIL;
const READONLY_PASSWORD = process.env.READONLY_PASSWORD;

// Rules the live app does not meet yet. Their tests keep the story's assertion
// and are marked `test.fail`; Playwright flags an unexpected pass once fixed.
const KNOWN_GAP = {
    notTaggedCommissioning: 'Filed checklist does not appear as a document tagged Commissioning',
    noFileRowOnline: 'A checklist completed online is not listed as a file row with download / delete actions',
};

/** Reset the test asset in its own browser context (hooks have no test-scoped page). */
async function resetTestAsset(browser: Browser) {
    const context = await browser.newContext({
        baseURL: process.env.BASE_URL,
        storageState: process.env.AUTH_JSON_PATH || 'auth.json',
        ignoreHTTPSErrors: true,
    });
    try {
        await new CommissioningChecklistDialog(await context.newPage()).resetChecklist(assetSerial);
    } finally {
        await context.close();
    }
}

test.describe.serial('Commissioning Checklist', () => {

    let template: ChecklistTemplate;
    let totalPoints: number;

    test.beforeAll(async ({ browser }) => {
        await resetTestAsset(browser);
    });

    test.afterAll(async ({ browser }) => {
        await resetTestAsset(browser);
    });

    // ---- The box -----------------------------------------------------------

    test('MSUP-COMMISSIONING-REPORT-TC001a_Box offers Fill out online and Upload scan or photos while Not provided', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openAssetDocuments(assetSerial);
        await commissioningChecklist.expectNotProvided();
        expect((await commissioningChecklist.checklistState()).status).toBe('missing');

        template = await commissioningChecklist.template();
        totalPoints = template.sections.reduce((n, s) => n + tickable(s).length, 0);
    });

    // ---- Upload: dialog and file selection (nothing is filed) --------------

    test('MSUP-COMMISSIONING-REPORT-TC002a_Upload scan or photos opens the upload dialog for the commissioning checklist', async ({ commissioningChecklistUpload }) => {
        await commissioningChecklistUpload.openDialogForAsset(assetSerial);
        await commissioningChecklistUpload.expectEmptyDropArea();
        await commissioningChecklistUpload.expectUploadDisabled();
    });

    test('MSUP-COMMISSIONING-REPORT-TC002b_Drop area offers Choose file and Take photos and names formats and maximum size', async ({ commissioningChecklistUpload }) => {
        await commissioningChecklistUpload.openDialogForAsset(assetSerial);
        await commissioningChecklistUpload.expectEmptyDropArea();
        await commissioningChecklistUpload.expectAcceptedFormatsAndSize();
    });

    test('MSUP-COMMISSIONING-REPORT-TC002c_A file can be added by dragging it onto the drop area', async ({ commissioningChecklistUpload }) => {
        await commissioningChecklistUpload.openDialogForAsset(assetSerial);
        await commissioningChecklistUpload.dropFile('dropped-checklist.pdf', 'application/pdf', '%PDF-1.4\n% dropped\n%%EOF\n');
        await commissioningChecklistUpload.expectSelectedFile('dropped-checklist.pdf', /\d+ KB/);
        await expect(commissioningChecklistUpload.uploadButton).toBeEnabled();
    });

    test('MSUP-COMMISSIONING-REPORT-TC002d_Selected file shows name and size and can be removed again', async ({ commissioningChecklistUpload }) => {
        await commissioningChecklistUpload.openDialogForAsset(assetSerial);
        await commissioningChecklistUpload.chooseFile(SCAN_PDF);
        await commissioningChecklistUpload.expectSelectedFile(SCAN_PDF_NAME, '1 KB');
        await commissioningChecklistUpload.removeFile(SCAN_PDF_NAME);
        await commissioningChecklistUpload.expectEmptyDropArea();
        await commissioningChecklistUpload.expectUploadDisabled();
    });

    test('MSUP-COMMISSIONING-REPORT-TC002e_Taken photos are listed page by page and further pages can be added', async ({ commissioningChecklistUpload }) => {
        await commissioningChecklistUpload.openDialogForAsset(assetSerial);
        await commissioningChecklistUpload.takePhotos(photo(1));
        await commissioningChecklistUpload.expectPages(1);
        await commissioningChecklistUpload.addPage(photo(2));
        await commissioningChecklistUpload.expectPages(2);
        await commissioningChecklistUpload.removeFile('Page 2');
        await commissioningChecklistUpload.expectPages(1);
    });

    test('MSUP-COMMISSIONING-REPORT-TC002f_Unsupported file type is rejected with a message', async ({ commissioningChecklistUpload }) => {
        await commissioningChecklistUpload.openDialogForAsset(assetSerial);
        await commissioningChecklistUpload.chooseFile(UNSUPPORTED_FILE);
        await commissioningChecklistUpload.expectFileRejected('unsupported.txt');
    });

    test('MSUP-COMMISSIONING-REPORT-TC002g_File larger than 12 MB is rejected with a message', async ({ commissioningChecklistUpload }) => {
        await commissioningChecklistUpload.openDialogForAsset(assetSerial);
        await commissioningChecklistUpload.chooseFile(TOO_LARGE_PDF);
        await commissioningChecklistUpload.expectFileRejected(TOO_LARGE_PDF.name);
    });

    test('MSUP-COMMISSIONING-REPORT-TC002h_HEIC photo is rejected with a message', async ({ commissioningChecklistUpload }) => {
        await commissioningChecklistUpload.openDialogForAsset(assetSerial);
        await commissioningChecklistUpload.chooseFile(HEIC_PHOTO);
        await commissioningChecklistUpload.expectFileRejected(HEIC_PHOTO.name);
    });

    test('MSUP-COMMISSIONING-REPORT-TC002i_Cancel discards the upload', async ({ commissioningChecklistUpload }) => {
        const { checklist } = commissioningChecklistUpload;
        await commissioningChecklistUpload.openDialogForAsset(assetSerial);
        await commissioningChecklistUpload.chooseFile(SCAN_PDF);
        await commissioningChecklistUpload.cancel();

        await checklist.expectNotProvided();
        expect((await checklist.checklistState()).status).toBe('missing');
        await commissioningChecklistUpload.openDialog();
        await commissioningChecklistUpload.expectEmptyDropArea();
    });

    test('MSUP-COMMISSIONING-REPORT-TC002j_Failed upload keeps the dialog open with an error and files nothing', async ({ commissioningChecklistUpload }) => {
        const { checklist } = commissioningChecklistUpload;
        await commissioningChecklistUpload.openDialogForAsset(assetSerial);
        await commissioningChecklistUpload.chooseFile(SCAN_PDF);
        await commissioningChecklistUpload.failNextUpload(500);
        await commissioningChecklistUpload.clickUpload();

        await checklist.report.expectToast();
        await expect(commissioningChecklistUpload.dialog).toBeVisible();
        await commissioningChecklistUpload.expectSelectedFile(SCAN_PDF_NAME, '1 KB');
        expect((await checklist.checklistState()).status).toBe('missing');
    });

    // ---- Online: opening and header ------------------------------------------

    test('MSUP-COMMISSIONING-REPORT-TC003a_Fill out online opens the Commissioning Checklist form', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openFormForAsset(assetSerial);
        await expect(commissioningChecklist.saveAndCloseButton).toBeVisible();
        await expect(commissioningChecklist.completeButton).toBeVisible();
    });

    test('MSUP-COMMISSIONING-REPORT-TC003b_Header displays the serial number, machine type and end customer', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openFormForAsset(assetSerial);
        const { prefill } = await commissioningChecklist.checklistForm();
        await commissioningChecklist.expectHeader(assetSerial, MACHINE_TYPE, prefill.companyName);
    });

    test('MSUP-COMMISSIONING-REPORT-TC003c_Information line states the checklist is optional and does not complete the setup', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openFormForAsset(assetSerial);
        await commissioningChecklist.expectOptionalNote();
    });

    // ---- Online: sections and points -----------------------------------------

    test('MSUP-COMMISSIONING-REPORT-TC004a_Checklist is displayed in sections following the template for the machine type', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openFormForAsset(assetSerial);
        await commissioningChecklist.expectSectionsFollowTemplate(template);
        // Machine-type section first, the shared "Training & Customer documentation" section last.
        expect(template.sections[0].title.en).toBe('MPRINT and MPRINTpro: set up machine');
        expect(template.sections.map(s => s.title.en)).toContain('System configuration and first buildjob');
        expect(template.sections.at(-1)!.title.en).toBe('Training & Customer documentation');
    });

    test('MSUP-COMMISSIONING-REPORT-TC004b_Section headers show x / y and sections can be expanded and collapsed', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openFormForAsset(assetSerial);
        for (const s of template.sections) {
            await commissioningChecklist.expectSectionCounter(s.key, 0, tickable(s).length);
        }
        const firstPoint = commissioningChecklist.pointRow(FIRST_POINT.section, FIRST_POINT.key);
        await commissioningChecklist.expandSection(SETUP);
        await expect(firstPoint).toBeVisible();
        await commissioningChecklist.collapseSection(SETUP);
        await expect(firstPoint).toBeHidden();
        await commissioningChecklist.expandSection(SETUP);
        await expect(firstPoint).toBeVisible();
    });

    test('MSUP-COMMISSIONING-REPORT-TC004c_Each point is displayed with its text as in the paper checklist, incl. bold machine-specific lines', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openFormForAsset(assetSerial);
        for (const s of template.sections) await commissioningChecklist.expectPointsFollowTemplate(s);

        const setup = template.sections.find(s => s.key === BOLD_POINT.section)!;
        const bold = setup.blocks.find(b => b.key === BOLD_POINT.key)!;
        await commissioningChecklist.expectBoldLines(BOLD_POINT.section, bold);
        await expect(commissioningChecklist.pointRow(BOLD_POINT.section, BOLD_POINT.key).locator('strong', { hasText: /^MPRINT: / })).toBeVisible();
        await expect(commissioningChecklist.pointRow(BOLD_POINT.section, BOLD_POINT.key).locator('strong', { hasText: /^MPRINTpro: / })).toBeVisible();
    });

    test('MSUP-COMMISSIONING-REPORT-TC004d_Sub-lines belonging to a point are displayed beneath it', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openFormForAsset(assetSerial);
        await commissioningChecklist.expandSection(SUB_LINES_POINT.section);
        const section = template.sections.find(s => s.key === SUB_LINES_POINT.section)!;
        await commissioningChecklist.expectSubLines(SUB_LINES_POINT.section, section.blocks.find(b => b.key === SUB_LINES_POINT.key)!);
    });

    test('MSUP-COMMISSIONING-REPORT-TC004e_Information notes and warnings have their own marker and are not tickable', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openFormForAsset(assetSerial);
        const section = template.sections.find(s => s.key === INFO_NOTE.section)!;
        await commissioningChecklist.expectInfoBlock(INFO_NOTE.section, section.blocks.find(b => b.key === INFO_NOTE.key)!);
        // Only tickable points count: the note is not part of the section counter or the progress.
        await commissioningChecklist.expectSectionCounter(INFO_NOTE.section, 0, tickable(section).length);
        expect(section.blocks.length).toBeGreaterThan(tickable(section).length);
        await commissioningChecklist.expectProgress(0, totalPoints, 0);
    });

    test('MSUP-COMMISSIONING-REPORT-TC004f_A linked document or video is displayed and opens in a new tab', async ({ commissioningChecklist, page }) => {
        await commissioningChecklist.openFormForAsset(assetSerial);
        await commissioningChecklist.expandSection(LINKED_POINT.section);
        const block = template.sections.find(s => s.key === LINKED_POINT.section)!.blocks.find(b => b.key === LINKED_POINT.key)!;
        const { url, label } = block.links![0];

        const link = commissioningChecklist.pointRow(LINKED_POINT.section, LINKED_POINT.key).getByRole('link', { name: label.en });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', url);
        await expect(link).toHaveAttribute('target', '_blank');

        const popup = page.waitForEvent('popup');
        await link.click();
        const tab = await popup;
        await expect(tab).toHaveURL(url.replace(/\/?$/, ''));
        await tab.close();
        await expect(commissioningChecklist.dialog).toBeVisible();
    });

    test('MSUP-COMMISSIONING-REPORT-TC004g_Each tickable point has a checkbox and an n/a option; n/a is excluded from the required count', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openFormForAsset(assetSerial);
        await commissioningChecklist.expandAll(template);
        for (const s of template.sections) {
            for (const b of tickable(s)) {
                await expect(commissioningChecklist.pointCheckbox(s.key, b.key)).toBeVisible();
                await expect(commissioningChecklist.pointNotApplicable(s.key, b.key)).toHaveText('N/A');
            }
        }
        const setupTotal = tickable(template.sections.find(s => s.key === SETUP)!).length;

        // n/a resolves the point without counting it as done.
        await commissioningChecklist.setNotApplicable(SECOND_POINT.section, SECOND_POINT.key, true);
        await commissioningChecklist.expectSectionCounter(SETUP, 1, setupTotal);
        await commissioningChecklist.expectProgress(0, totalPoints, 1);

        // Marking a ticked point n/a unticks it; it is counted once.
        await commissioningChecklist.setPoint(FIRST_POINT.section, FIRST_POINT.key, true);
        await commissioningChecklist.expectProgress(1, totalPoints, 1);
        await commissioningChecklist.setNotApplicable(FIRST_POINT.section, FIRST_POINT.key, true);
        await expect(commissioningChecklist.pointCheckbox(FIRST_POINT.section, FIRST_POINT.key)).not.toBeChecked();
        await commissioningChecklist.expectSectionCounter(SETUP, 2, setupTotal);
        await commissioningChecklist.expectProgress(0, totalPoints, 2);

        // Required count: everything except the n/a points must be ticked to complete.
        await commissioningChecklist.resolveAllPoints(template, [`${SETUP}.${FIRST_POINT.key}`, `${SETUP}.${SECOND_POINT.key}`]);
        await commissioningChecklist.expectProgress(totalPoints - 2, totalPoints, 2);
        await commissioningChecklist.expectCompleteEnabled();
    });

    test('MSUP-COMMISSIONING-REPORT-TC004h_All points of a section marked n/a resolve the section', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openFormForAsset(assetSerial);
        const setup = template.sections.find(s => s.key === SETUP)!;
        await commissioningChecklist.expandSection(SETUP);
        for (const b of tickable(setup)) await commissioningChecklist.setNotApplicable(SETUP, b.key, true);

        await commissioningChecklist.expectSectionCounter(SETUP, tickable(setup).length, tickable(setup).length);
        await commissioningChecklist.expectProgress(0, totalPoints, tickable(setup).length);
        // The other sections are still open, so the checklist cannot be completed yet.
        await commissioningChecklist.expectCompleteDisabled();
    });

    // ---- Online: progress, saving and completion -----------------------------

    test('MSUP-COMMISSIONING-REPORT-TC005a_Progress line and bar show x of y points done with the number marked n/a', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openFormForAsset(assetSerial);
        await commissioningChecklist.expectProgress(0, totalPoints, 0);
        await commissioningChecklist.expandSection(SETUP);
        await commissioningChecklist.setPoint(FIRST_POINT.section, FIRST_POINT.key, true);
        await commissioningChecklist.setPoint(THIRD_POINT.section, THIRD_POINT.key, true);
        await commissioningChecklist.setNotApplicable(SECOND_POINT.section, SECOND_POINT.key, true);
        await commissioningChecklist.expectProgress(2, totalPoints, 1);
        await expect(commissioningChecklist.progressBar).toHaveAccessibleName(`2 of ${totalPoints} points done`);
    });

    test('MSUP-COMMISSIONING-REPORT-TC005b_Closing the form with unsaved entries asks before discarding them', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openFormForAsset(assetSerial);
        await commissioningChecklist.expandSection(SETUP);
        await commissioningChecklist.setPoint(FIRST_POINT.section, FIRST_POINT.key, true);

        // "Close" on the confirmation keeps the form and the entry.
        await commissioningChecklist.closeWithX();
        await expect(commissioningChecklist.discardDialog).toBeVisible();
        await commissioningChecklist.discardDialog.getByRole('button', { name: 'Close', exact: true }).click();
        await expect(commissioningChecklist.dialog).toBeVisible();
        await expect(commissioningChecklist.pointCheckbox(FIRST_POINT.section, FIRST_POINT.key)).toBeChecked();

        // "Discard and close" keeps nothing.
        await commissioningChecklist.closeWithX();
        await commissioningChecklist.discardChanges();
        await commissioningChecklist.expectNotProvided();
        expect((await commissioningChecklist.checklistState()).status).toBe('missing');
    });

    test('MSUP-COMMISSIONING-REPORT-TC005c_Save and close keeps the entries and reopening the form restores them', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openAssetDocuments(assetSerial);
        const setupBefore = await commissioningChecklist.setupProgress();
        await commissioningChecklist.openForm();
        await commissioningChecklist.expandSection(SETUP);
        await commissioningChecklist.setPoint(FIRST_POINT.section, FIRST_POINT.key, true);
        await commissioningChecklist.setNotApplicable(SECOND_POINT.section, SECOND_POINT.key, true);
        await commissioningChecklist.saveAndClose();

        await commissioningChecklist.report.expectToast('Checklist saved');
        await commissioningChecklist.expectDraft(1, totalPoints, 1);
        expect((await commissioningChecklist.checklistState()).status).toBe('draft');
        expect(await commissioningChecklist.setupProgress(), 'Saving never changes the Machine setup counter').toBe(setupBefore);
        await commissioningChecklist.expectLogged(assetSerial, RUN_START, 'commissioning_checklist_draft_saved');

        await commissioningChecklist.openForm();   // "Continue checklist"
        await commissioningChecklist.expectProgress(1, totalPoints, 1);
        await commissioningChecklist.expandSection(SETUP);
        await expect(commissioningChecklist.pointCheckbox(FIRST_POINT.section, FIRST_POINT.key)).toBeChecked();
        await expect(commissioningChecklist.pointNotApplicable(SECOND_POINT.section, SECOND_POINT.key)).toHaveAttribute('aria-pressed', 'true');
        await expect(commissioningChecklist.pointCheckbox(THIRD_POINT.section, THIRD_POINT.key)).not.toBeChecked();
    });

    test('MSUP-COMMISSIONING-REPORT-TC005d_Complete checklist is only enabled when every point is ticked or n/a', async ({ commissioningChecklist }) => {
        test.setTimeout(120_000);
        const last = template.sections.at(-1)!;
        const lastPoint = tickable(last).at(-1)!;

        await commissioningChecklist.openFormForAsset(assetSerial);
        await commissioningChecklist.expectCompleteDisabled();
        await commissioningChecklist.resolveAllPoints(template, NOT_APPLICABLE_ON_COMPLETE, [`${last.key}.${lastPoint.key}`]);
        await commissioningChecklist.expectProgress(totalPoints - 2, totalPoints, 1);
        await commissioningChecklist.expectCompleteDisabled();      // one point still open

        await commissioningChecklist.setNotApplicable(last.key, lastPoint.key, true);
        await commissioningChecklist.expectCompleteEnabled();       // ticked or n/a everywhere
        await commissioningChecklist.setNotApplicable(last.key, lastPoint.key, false);
        await commissioningChecklist.expectCompleteDisabled();
        await commissioningChecklist.setPoint(last.key, lastPoint.key, true);
        await commissioningChecklist.expectCompleteEnabled();

        await commissioningChecklist.saveAndClose();
    });

    test('MSUP-COMMISSIONING-REPORT-TC005e_Completing files the checklist, sets the tag to On file and leaves the Machine setup counter unchanged', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openAssetDocuments(assetSerial);
        const setupBefore = await commissioningChecklist.setupProgress();
        await commissioningChecklist.openForm();
        await commissioningChecklist.expectProgress(totalPoints - 1, totalPoints, 1);
        await commissioningChecklist.completeChecklist();

        await commissioningChecklist.report.expectToast('Checklist completed and filed');
        await commissioningChecklist.expectCompletedOnline();
        expect(await commissioningChecklist.setupProgress(), 'Completing never changes the Machine setup counter').toBe(setupBefore);

        const state = await commissioningChecklist.checklistState();
        expect(state.status).toBe('on_file');
        expect(state.source).toBe('online');
        expect(state.progress).toEqual({ done: totalPoints - 1, notApplicable: 1, total: totalPoints });
        // The template version used is stored with the checklist.
        expect((await commissioningChecklist.checklistForm()).form.templateVersion).toBe(template.version);
        await commissioningChecklist.expectLogged(assetSerial, RUN_START, 'commissioning_checklist_completed');
    });

    test('MSUP-COMMISSIONING-REPORT-TC005f_A completed checklist can be reopened for viewing', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openFormForAsset(assetSerial);   // "View"
        await commissioningChecklist.expectProgress(totalPoints - 1, totalPoints, 1);
        await commissioningChecklist.expectReadOnly(template);
        for (const s of template.sections) await commissioningChecklist.expectSectionCounter(s.key, tickable(s).length, tickable(s).length);
        await expect(commissioningChecklist.pointNotApplicable(SECOND_POINT.section, SECOND_POINT.key)).toHaveAttribute('aria-pressed', 'true');
    });

    test('MSUP-COMMISSIONING-REPORT-TC005g_Checklist completed online is listed as a file row with download and delete actions', async ({ commissioningChecklist }) => {
        test.fail(true, KNOWN_GAP.noFileRowOnline);
        await commissioningChecklist.openAssetDocuments(assetSerial);
        await expect(commissioningChecklist.fileRows).toHaveCount(1);
        await expect(commissioningChecklist.fileRows.getByRole('button', { name: /^Download/ })).toBeVisible();
        await expect(commissioningChecklist.fileRows.getByRole('button', { name: /^Delete/ })).toBeVisible();
    });

    // ---- Both routes: one checklist per machine, replacement -----------------

    test('MSUP-COMMISSIONING-REPORT-TC006a_Uploading over a filed checklist asks for confirmation and keeps the previous version', async ({ commissioningChecklistUpload }) => {
        const { checklist } = commissioningChecklistUpload;
        await checklist.openAssetDocuments(assetSerial);
        const setupBefore = await checklist.setupProgress();

        await commissioningChecklistUpload.openDialog();          // "Replace with scan or photos"
        await commissioningChecklistUpload.chooseFile(REPLACEMENT_PDF);
        const request = await commissioningChecklistUpload.uploadReplacement();
        expect(request.postDataJSON().replace).toBe(true);

        await checklist.report.expectToast('Checklist replaced. The previous version is kept.');
        await commissioningChecklistUpload.expectUploadedOnFile(REPLACEMENT_PDF.name);
        await expect(checklist.previousVersionsToggle).toHaveText(/Previous versions \(1\)/);
        expect(await checklist.setupProgress()).toBe(setupBefore);

        const state = await checklist.checklistState();
        expect(state.files).toHaveLength(1);
        expect(state.previousVersions).toHaveLength(1);
        expect(state.previousVersions[0].source).toBe('online');
        await checklist.expectLogged(assetSerial, RUN_START, 'commissioning_checklist_replaced');
    });

    test('MSUP-COMMISSIONING-REPORT-TC006b_Closing the replacement confirmation keeps the checklist on file unchanged', async ({ commissioningChecklistUpload }) => {
        const { checklist } = commissioningChecklistUpload;
        await commissioningChecklistUpload.openDialogForAsset(assetSerial);
        await commissioningChecklistUpload.chooseFile(SCAN_PDF);
        await commissioningChecklistUpload.uploadButton.click();
        await expect(commissioningChecklistUpload.replaceDialog).toBeVisible();
        await commissioningChecklistUpload.replaceDialog.getByRole('button', { name: 'Close', exact: true }).click();
        await expect(commissioningChecklistUpload.replaceDialog).toBeHidden();

        const state = await checklist.checklistState();
        expect(state.files.map(f => f.name)).toEqual([REPLACEMENT_PDF.name]);
        expect(state.previousVersions).toHaveLength(1);
    });

    test('MSUP-COMMISSIONING-REPORT-TC006c_Filed checklist is listed as a file row with download and delete actions', async ({ commissioningChecklist, page }) => {
        await commissioningChecklist.openAssetDocuments(assetSerial);
        await commissioningChecklist.expectFileRow(REPLACEMENT_PDF.name);

        const download = page.waitForEvent('download');
        await commissioningChecklist.fileRow(REPLACEMENT_PDF.name).getByRole('button', { name: `Download ${REPLACEMENT_PDF.name}` }).click();
        expect((await download).suggestedFilename()).toBe(REPLACEMENT_PDF.name);
    });

    test('MSUP-COMMISSIONING-REPORT-TC006d_Filed checklist is a document tagged Commissioning', async ({ commissioningChecklist }) => {
        test.fail(true, KNOWN_GAP.notTaggedCommissioning);
        await commissioningChecklist.openAssetDocuments(assetSerial);
        const panel = commissioningChecklist.report.sidePanel;
        await expect(panel.getByRole('button', { name: 'Commissioning', exact: true })).toBeVisible();
        await expect(panel.getByRole('heading', { name: 'Commissioning Documents', level: 3 })).toBeVisible();
    });

    test('MSUP-COMMISSIONING-REPORT-TC006e_User without edit rights sees the box and the file but no actions', async ({ browser }) => {
        test.skip(!READONLY_EMAIL || !READONLY_PASSWORD, 'Set READONLY_EMAIL / READONLY_PASSWORD in .env to a user without edit rights on this asset');
        const context = await browser.newContext({ baseURL: process.env.BASE_URL, ignoreHTTPSErrors: true, storageState: { cookies: [], origins: [] } });
        try {
            const page = await context.newPage();
            const login = new LoginPage(page);
            await login.goto(process.env.BASE_URL || '');
            await login.login(READONLY_EMAIL!, READONLY_PASSWORD!);
            await login.verifyDashboard();

            const checklist = new CommissioningChecklistDialog(page);
            await checklist.openAssetDocuments(assetSerial);
            await checklist.expectTag('On file');
            await expect(checklist.fileRow(REPLACEMENT_PDF.name)).toBeVisible();
            await expect(checklist.uploadScanButton).toHaveCount(0);
            await expect(checklist.fillOutOnlineButton).toHaveCount(0);
            await expect(checklist.fileRow(REPLACEMENT_PDF.name).getByRole('button', { name: /^(Delete|Download) / })).toHaveCount(0);
        } finally {
            await context.close();
        }
    });

    test('MSUP-COMMISSIONING-REPORT-TC006f_Deleting the filed checklist removes it with its versions and returns the box to Not provided', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openAssetDocuments(assetSerial);
        const setupBefore = await commissioningChecklist.setupProgress();
        await commissioningChecklist.deleteChecklist(
            commissioningChecklist.fileRow(REPLACEMENT_PDF.name).getByRole('button', { name: `Delete ${REPLACEMENT_PDF.name}` }));

        await commissioningChecklist.report.expectToast('Checklist deleted');
        await commissioningChecklist.expectNotProvided();
        const state = await commissioningChecklist.checklistState();
        expect(state.status).toBe('missing');
        expect(state.previousVersions).toHaveLength(0);
        expect(await commissioningChecklist.setupProgress()).toBe(setupBefore);
        await commissioningChecklist.expectLogged(assetSerial, RUN_START, 'commissioning_checklist_deleted');
    });

    // ---- Upload route: filing ------------------------------------------------

    test('MSUP-COMMISSIONING-REPORT-TC007a_Uploaded photos are combined into one PDF, filed On file and the Machine setup counter is unchanged', async ({ commissioningChecklistUpload }) => {
        const { checklist } = commissioningChecklistUpload;
        await checklist.openAssetDocuments(assetSerial);
        const setupBefore = await checklist.setupProgress();

        await commissioningChecklistUpload.openDialog();
        await commissioningChecklistUpload.takePhotos(photo(1));
        await commissioningChecklistUpload.addPage(photo(2));
        await commissioningChecklistUpload.expectPages(2);
        const request = await commissioningChecklistUpload.upload();
        const fileName: string = request.postDataJSON().file.name;
        expect(fileName, 'Both pages travel as one PDF').toMatch(/\.pdf$/i);

        await checklist.report.expectToast('Checklist uploaded and filed');
        await commissioningChecklistUpload.expectUploadedOnFile(fileName);
        expect(await checklist.setupProgress(), 'Uploading never changes the Machine setup counter').toBe(setupBefore);

        const state = await checklist.checklistState();
        expect(state.status).toBe('on_file');
        expect(state.source).toBe('upload');
        expect(state.files.map(f => f.name)).toEqual([fileName]);
        await checklist.expectLogged(assetSerial, RUN_START, 'commissioning_checklist_uploaded');
    });

    test('MSUP-COMMISSIONING-REPORT-TC007b_A machine has only one commissioning checklist - the online form is no longer offered once one is uploaded', async ({ commissioningChecklist }) => {
        await commissioningChecklist.openAssetDocuments(assetSerial);
        await commissioningChecklist.expectTag('On file');
        await expect(commissioningChecklist.fileRows).toHaveCount(1);
        await expect(commissioningChecklist.card.getByRole('button', { name: /Fill out online|Continue checklist/ })).toHaveCount(0);
        await expect(commissioningChecklist.uploadScanButton).toHaveText(/Replace with scan or photos/);
        expect((await commissioningChecklist.checklistState()).files).toHaveLength(1);
    });

    // ---- Exceptional cases that need other data or a second session --------

    test.fixme('MSUP-COMMISSIONING-REPORT-TC008a_Machine type without a checklist template', async () => {
        // Needs an asset whose machine type has no template; the template on QA applies to every machine type.
    });

    test.fixme('MSUP-COMMISSIONING-REPORT-TC008b_A linked document or video is unavailable', async () => {
        // Expected behaviour for an unavailable link is not specified in the story.
    });

    test.fixme('MSUP-COMMISSIONING-REPORT-TC008c_A second user edits or files the same checklist at the same time', async () => {
        // Needs a second login with edit rights; expected outcome is not specified in the story.
    });

    test.fixme('MSUP-COMMISSIONING-REPORT-TC008d_Checklist template is published in a new version while the form is open', async () => {
        // Needs a template publish on QA mid-test.
    });
});
