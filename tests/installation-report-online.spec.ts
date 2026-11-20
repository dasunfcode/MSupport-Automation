import { Browser } from '@playwright/test';
import { test, expect } from '../fixtures/fixtures';
import { InstallationReportDialog } from '../pages/InstallationReportDialog';

// ==================== EASY-TO-CHANGE TEST DATA ====================
// Dedicated test machine. An asset holds only one installation report, so the
// suite resets it (draft, filed report, signature files, versions) before and
// after the run to leave a clean slate for the next run.
const assetSerial = 'MPR01227';
const ASSET_TYPE = 'MPRINT';
const ASSET_COMPONENT = 'mprint' as const;      // template component matching ASSET_TYPE
const OTHER_COMPONENT = 'mpure' as const;       // any component not matching the asset
const RUN_ID = Date.now();

const REPORT = {
    address: 'Automation Street 1, Colombo',
    contactPerson: `Contact ${RUN_ID}`,
    description: `Remarks ${RUN_ID}`,
    customerName: 'Jane Customer',
    customerRole: 'Plant manager',
    customerPlace: 'Colombo',
    engineerPlace: 'Colombo',
};

// Signature request: example.com is reserved (RFC 2606) and the request is
// intercepted anyway, so no real e-mail is ever sent by this suite.
const SIGNER = { name: 'Jane Customer', email: `ir-signer-${RUN_ID}@example.com`, message: 'Please sign the installation report.' };

/** Reset the test asset in its own browser context (hooks have no test-scoped page). */
async function resetTestAsset(browser: Browser) {
    const context = await browser.newContext({
        baseURL: process.env.BASE_URL,
        storageState: process.env.AUTH_JSON_PATH || 'auth.json',
        ignoreHTTPSErrors: true,
    });
    try {
        await new InstallationReportDialog(await context.newPage()).resetReport(assetSerial);
    } finally {
        await context.close();
    }
}

test.describe.serial('Installation Report - Online', () => {
    // Uploading and filing go through QA file storage, which can take 30 s+ per call.
    test.describe.configure({ timeout: 150_000 });

    test.beforeAll(async ({ browser }) => {
        await resetTestAsset(browser);
    });

    // Serial mode skips the remaining tests after a failure, so cleanup lives in
    // afterAll: it always runs and removes whatever the run saved or filed.
    test.afterAll(async ({ browser }) => {
        await resetTestAsset(browser);
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC000_Test asset starts without an installation report', async ({ installationReport }) => {
        await installationReport.openAssetDocuments(assetSerial);
        await installationReport.expectReportMissing();
    });

    // ---- Opening and structure ---------------------------------------------

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC001a_Fill out online opens the Installation Report form', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC001b_Header shows title, serial number, machine type and end customer', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectHeader(assetSerial, ASSET_TYPE);
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC001c_Form shows the four numbered sections in paper-form order', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectSectionsInOrder();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC001d_Close X discards unsaved changes after confirmation', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.fillCustomerField('contact_person', 'Unsaved contact');
        await installationReport.closeWithX();
        await installationReport.discardChanges();

        await installationReport.openForm();
        await expect(installationReport.customerField('contact_person')).toHaveValue('');
    });

    // ---- 1 Customer Information --------------------------------------------

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC002a_Company, address, phone and e-mail are pre-filled from the record', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        const [, , endCustomer] = await installationReport.headerParts();
        await installationReport.expectCustomerFieldsPrefilled(endCustomer);
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC002b_Contact Person is empty and can be entered', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectContactPersonEmptyAndEditable(REPORT.contactPerson);
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC002c_All five customer fields remain editable', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectAllCustomerFieldsEditable();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC002d_All five customer fields are mandatory', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectAllCustomerFieldsMandatory();
    });

    // ---- 2 Components ------------------------------------------------------

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC003a_Paper-form components are listed, each with checkbox and serial field', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectComponentsListed();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC003b_Serial number is only editable when the component is ticked', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectSerialOnlyEditableWhenTicked(OTHER_COMPONENT);
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC003c_Component matching the asset is pre-ticked with its serial number', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectComponentPreTicked(ASSET_COMPONENT, assetSerial);
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC003d_At least one component with a serial number is required', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectAtLeastOneComponentRequired();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC003e_A ticked component without a serial number blocks filing', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.fillCompleteReport(REPORT);
        await installationReport.expectCompleteEnabled();

        await installationReport.componentSerial(ASSET_COMPONENT).fill('');
        await installationReport.expectCompleteDisabled();
        await installationReport.tryToFile();
        await expect(installationReport.dialog.getByTestId(`commissioning-component-components-${ASSET_COMPONENT}`)
            .locator('xpath=..')).toContainText(/required/i);
    });

    // ---- 3 Content of the Initial Operation --------------------------------

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC004a_Points and sub-points match the paper form order and wording', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectPointsInPaperOrder();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC004b_Every point is mandatory and no required tag is displayed', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectEveryPointMandatoryWithoutRequiredTag();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC004c_Description is the last field of the section and optional', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectDescriptionOptional();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC004d_Hint with checklist link is shown when no commissioning checklist exists', async ({ installationReport }) => {
        // Known gap: the QA build (Nov 2026) has no such hint in the form or its translations.
        // Remove this once the hint ships; the test then reports an unexpected pass.
        test.fail(true, 'Checklist hint is not implemented yet');
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectChecklistHint();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC004e_A single unticked point blocks filing', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.fillCompleteReport(REPORT);
        await installationReport.expectCompleteEnabled();

        await installationReport.setPoint('operator_manual', false);
        await installationReport.expectCompleteDisabled();
        await installationReport.tryToFile();
        await expect(installationReport.pointRow('operator_manual')).toContainText('This point must be confirmed');
    });

    // ---- 4 Signatures ------------------------------------------------------

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC005a_Customer and Service Engineer blocks each have Date and Place', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectTwoSignatureBlocks();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC005b_Engineer block has signature field, Clear and the engineer name', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectEngineerBlock();
        await installationReport.drawSignature('service_engineer');
        await installationReport.clearSignature('service_engineer');
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC005c_Customer block offers Customer signs here and Send by e-mail', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await expect(installationReport.customerSignsHere).toHaveText('Customer signs here');
        await expect(installationReport.customerSendEmail).toHaveText('Send by e-mail');
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC005d_Customer signs here shows Date, Place, signature, Name and optional Role', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectSignsHereFields();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC005e_Send by e-mail shows name, e-mail, language, optional message and Send Request', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.chooseSendByEmail();
        await installationReport.expectSendByEmailFields();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC005f_Engineer signature, date and place are required in both options', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectEngineerSignatureRequired();
        await installationReport.chooseSendByEmail();
        await installationReport.expectEngineerSignatureRequired();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC005g_Clearing the engineer signature disables filing', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.fillCompleteReport(REPORT);
        await installationReport.expectCompleteEnabled();

        await installationReport.clearSignature('service_engineer');
        await installationReport.expectCompleteDisabled();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC005h_Customer signature drawn without a name blocks filing', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.fillCompleteReport(REPORT);
        await installationReport.customerName.fill('');
        await installationReport.expectCompleteDisabled();
        await installationReport.tryToFile();
        await expect(installationReport.signatureBlock('customer')).toContainText('This field is required');
    });

    // ---- Signature request by e-mail (intercepted, no mail is sent) ---------

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC006a_Send Request rejects an invalid e-mail address', async ({ installationReport, page }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.chooseSendByEmail();
        await installationReport.fillSignatureRequest(SIGNER.name, 'not-an-email');

        let sent = false;
        page.on('request', r => { if (r.url().endsWith('/signature-request')) sent = true; });
        await installationReport.sendRequestButton.click();
        await expect(installationReport.requestBlock).toContainText('Invalid email address');
        expect(sent, 'No request may be sent for an invalid address').toBeFalsy();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC006b_Send Request posts the signer, address, language and message', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.fillCompleteReport(REPORT);
        await installationReport.chooseSendByEmail();
        await installationReport.fillSignatureRequest(SIGNER.name, SIGNER.email, 'German', SIGNER.message);

        // Intercept: the payload is verified but never reaches the mail service.
        const captured = await installationReport.stubNext('signatureRequest', 500);
        await installationReport.sendSignatureRequest();
        await installationReport.expectToast();

        const body = captured().postDataJSON();
        expect(body).toMatchObject({
            recipientName: SIGNER.name,
            recipientEmail: SIGNER.email,
            language: 'de',
        });
        expect(JSON.stringify(body)).toContain(SIGNER.message);
        // The engineer signs in the form; the customer signs later from the e-mail.
        expect(body.signatures.service_engineer).toMatchObject({ place: REPORT.engineerPlace });
        expect(body.signatures.service_engineer.path).toBeTruthy();
        expect(body.signatures.customer).toBeUndefined();
        expect(body.answers.customer_information.contact_person).toBe(REPORT.contactPerson);
        // Form stays open after a failed send.
        await expect(installationReport.dialog).toBeVisible();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC006c_Successful Send Request confirms and closes the form', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.fillCompleteReport(REPORT);
        await installationReport.chooseSendByEmail();
        await installationReport.fillSignatureRequest(SIGNER.name, SIGNER.email, 'English', SIGNER.message);

        // Fake a successful send: the UI behaves as on success, but no e-mail goes out.
        const captured = await installationReport.stubNext('signatureRequest', 200, { success: true, data: {} });
        await installationReport.sendSignatureRequest();

        await installationReport.expectToast('The report was sent to the customer for signature.');
        await expect(installationReport.dialog).toBeHidden();
        expect(captured().postDataJSON()).toMatchObject({ recipientEmail: SIGNER.email, language: 'en' });

        // The request never reached the server, so the asset is unchanged.
        expect((await installationReport.reportState()).status).toBe('missing');
        expect((await installationReport.reportState()).signatureRequest).toBeNull();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC006d_Send Request on an incomplete form shows an error and sends nothing', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        const sentCount = await installationReport.blockAndCount('signatureRequest');
        await installationReport.chooseSendByEmail();
        await installationReport.fillSignatureRequest(SIGNER.name, SIGNER.email);

        await installationReport.sendRequestButton.click();
        await installationReport.expectToast('Please fill in all required fields and signatures');
        await expect(installationReport.dialog).toBeVisible();
        expect(sentCount(), 'No signature request may be sent for an incomplete form').toBe(0);
    });

    // ---- Footer and saving -------------------------------------------------

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC007a_Preview shows the report as the finished read-only document', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.openPreview();
        await installationReport.expectPreviewIsReadOnly();
        await installationReport.backToEdit();
        await expect(installationReport.customerField('contact_person')).toBeEditable();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC007b_Primary action is only enabled when every mandatory field is filled', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.expectCompleteDisabled();
        await installationReport.fillCompleteReport(REPORT);
        await installationReport.expectCompleteEnabled();

        await installationReport.fillCustomerField('contact_person', '');
        await installationReport.expectCompleteDisabled();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC007c_Unfilled mandatory fields are indicated when trying to file', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.tryToFile();
        await expect(installationReport.customerFieldContainer('contact_person')).toContainText('This field is required');
        await expect(installationReport.signatureBlock('service_engineer')).toContainText('A signature is required');
        await expect(installationReport.dialog).toBeVisible();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC007d_Failed save keeps the form open and shows an error', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.fillCustomerField('contact_person', REPORT.contactPerson);
        await installationReport.stubNext('draft', 500);
        await installationReport.saveDraftButton.click();
        await installationReport.expectToast();
        await expect(installationReport.dialog).toBeVisible();
        await expect(installationReport.customerField('contact_person')).toHaveValue(REPORT.contactPerson);
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC007e_Filing that times out keeps the form open and shows an error', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.fillCompleteReport(REPORT);
        await installationReport.failNextWithTimeout('complete');
        await installationReport.clickAndAwaitRequest(installationReport.completeButton, 'complete');
        await installationReport.expectToast();
        await expect(installationReport.dialog).toBeVisible();
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC007f_Save draft stores the entries and reopening restores them', async ({ installationReport }) => {
        await installationReport.openFormForAsset(assetSerial);
        await installationReport.fillCustomerInformation({ address: REPORT.address, contactPerson: REPORT.contactPerson });
        await installationReport.setPoint('customer_trained', true);
        await installationReport.description.fill(REPORT.description);
        await installationReport.saveDraft();

        await installationReport.openAssetDocuments(assetSerial);
        await installationReport.openForm();
        await expect(installationReport.customerField('address')).toHaveValue(REPORT.address);
        await expect(installationReport.customerField('contact_person')).toHaveValue(REPORT.contactPerson);
        await expect(installationReport.pointCheckbox('customer_trained')).toBeChecked();
        await expect(installationReport.pointCheckbox('help_section_videos_seen')).toBeChecked();
        await expect(installationReport.description).toHaveValue(REPORT.description);
    });

    // ---- Filing (irreversible for this asset) ------------------------------

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC008a_Filing shows the report on file and updates the Machine setup strip', async ({ installationReport }) => {
        await installationReport.openAssetDocuments(assetSerial);
        const progressBefore = await installationReport.setupProgress();

        await installationReport.openForm();
        await installationReport.fillCompleteReport(REPORT);
        await installationReport.fileReport();

        await installationReport.expectReportOnFile();
        expect(await installationReport.setupProgress()).toBe(progressBefore + 1);
    });

    test('MSUP-INSTALLATION-REPORT-ONLINE-TC008b_Only one report per asset - Fill out online is no longer offered', async ({ installationReport }) => {
        await installationReport.openAssetDocuments(assetSerial);
        await installationReport.expectReportOnFile();
    });

    // ---- Exceptional cases that need a second session / backend control ----

    test.fixme('MSUP-INSTALLATION-REPORT-ONLINE-TC009a_Draft opened by a second user while the first has it open', async () => {
        // Needs a second login (createTicketPage-style worker fixture with other credentials).
    });

    test.fixme('MSUP-INSTALLATION-REPORT-ONLINE-TC009b_Another user files a report while the form is open', async () => {
        // Needs a second session filing against the same asset mid-test.
    });

    test.fixme('MSUP-INSTALLATION-REPORT-ONLINE-TC009c_Template is published in a new version while the form is open', async () => {
        // Needs admin access to publish an Installation Report template version.
    });

    test.fixme('MSUP-INSTALLATION-REPORT-ONLINE-TC009d_Asset type without a matching component - nothing is pre-ticked', async () => {
        // Needs an asset type that has no component in the template.
    });

    test.fixme('MSUP-INSTALLATION-REPORT-ONLINE-TC009e_Organization without phone or e-mail - fields filled by hand', async () => {
        // Needs a dedicated end-customer organization with no phone / e-mail on record.
    });

});
