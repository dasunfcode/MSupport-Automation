import path from 'path';
import { test, expect } from '../fixtures/fixtures';

// ==================== EASY-TO-CHANGE TEST DATA ====================
const stamp = Date.now();
const TICKET_NAME = `MSUP Service Case ${stamp}`;
const DESCRIPTION = [
    'Automated Service Case created by Playwright.',
    'This description spans multiple lines to verify multi-line input.',
].join('\n');
const CONTACT_NAME = 'QA Automation';

// The form only accepts an email from the company domain or an MSupport user.
const CONTACT_EMAIL = 'tharusha@fcodelabs.com';
const UNAUTHORIZED_EMAIL = 'qa.automation@example.com';
const INVALID_EMAIL = 'not-an-email';

// Company is prefilled from the URL and cannot be edited.
const COMPANY_NAME = 'One Click Metal';

// Valid device/asset combination (asset serial must match the device family prefix).
const DEVICE_TYPE = 'MPRINT';
const AFFECTED_ASSET = 'MPR00001';

// Invalid combination: MPURE expects an MPU-prefixed serial, MBS91534 does not match.
const MISMATCH_DEVICE_TYPE = 'MPURE';
const MISMATCH_ASSET = 'MBS91534';
const MISMATCH_PREFIX = 'MPU';

// Sample upload files (created under data/uploads).
const SUPPORTED_FILE = path.resolve(__dirname, '../data/uploads/sample.html');
const SUPPORTED_FILE_NAME = 'sample.html';
const UNSUPPORTED_FILE = path.resolve(__dirname, '../data/uploads/unsupported.txt');
const UNSUPPORTED_FILE_NAME = 'unsupported.txt';

test.describe.serial('MSUP Service Case - Create Service Case (public ticket form)', () => {
    test('MSUP-SERVICECASE-TC001a_Create Service Case with attachment', async ({ serviceCasePage }) => {
        await serviceCasePage.selectTicketType('Problem');
        await serviceCasePage.fillTicketName(TICKET_NAME);
        await serviceCasePage.selectDeviceType(DEVICE_TYPE);
        await serviceCasePage.fillAffectedAsset(AFFECTED_ASSET);
        await serviceCasePage.fillDescription(DESCRIPTION);

        await serviceCasePage.fillName(CONTACT_NAME);
        await serviceCasePage.expectCompanyPrefilledAndLocked(COMPANY_NAME);
        await serviceCasePage.fillEmail(CONTACT_EMAIL);

        // Attach a supporting file and classify it before submitting.
        await serviceCasePage.uploadFiles(SUPPORTED_FILE);
        await serviceCasePage.expectFileUploaded(SUPPORTED_FILE_NAME);
        await serviceCasePage.setDocumentTag(SUPPORTED_FILE_NAME, 'Faulty Part');

        await serviceCasePage.expectSubmitEnabled();
        await serviceCasePage.submit();

        const reference = await serviceCasePage.expectSubmissionConfirmed(CONTACT_EMAIL);
        expect(reference).toMatch(/^TM-\d+$/);
    });

    test('MSUP-SERVICECASE-TC002a_Ticket type is single-select', async ({ serviceCasePage }) => {
        await serviceCasePage.selectTicketType('Problem');
        await serviceCasePage.expectOnlyTicketTypeSelected('Problem');

        // Selecting a new type must clear the previously selected one.
        await serviceCasePage.selectTicketType('Feedback');
        await serviceCasePage.expectOnlyTicketTypeSelected('Feedback');
    });

    test('MSUP-SERVICECASE-TC003a_Company name is prefilled and locked', async ({ serviceCasePage }) => {
        // Opened via ?companyName=One+Click+Metal&isCompanyNameEditable=false.
        await serviceCasePage.expectCompanyPrefilledAndLocked(COMPANY_NAME);
    });

    test('MSUP-SERVICECASE-TC004a_Affected Asset disabled until Device Type selected', async ({
        serviceCasePage,
    }) => {
        await serviceCasePage.expectAffectedAssetDisabled();
        await serviceCasePage.selectDeviceType(DEVICE_TYPE);
        await serviceCasePage.expectAffectedAssetMandatory();
    });

    test('MSUP-SERVICECASE-TC005a_Mandatory fields prevent submission', async ({ serviceCasePage }) => {
        // With an empty form the Submit button stays disabled.
        await serviceCasePage.expectSubmitDisabled();

        // Touching then clearing the Ticket Name surfaces the required error.
        await serviceCasePage.touchAndClearTicketName();
        await serviceCasePage.expectFieldError('Ticket name is required.');
    });

    test('MSUP-SERVICECASE-TC006a_Invalid email format is rejected', async ({ serviceCasePage }) => {
        await serviceCasePage.fillEmailAndBlur(INVALID_EMAIL);
        await serviceCasePage.expectFieldError(
            'Enter a valid email address from your company domain or an MSupport user email.',
        );
    });

    test('MSUP-SERVICECASE-TC006b_Unauthorized email is rejected on submit', async ({
        serviceCasePage,
    }) => {
        await serviceCasePage.selectTicketType('Problem');
        await serviceCasePage.fillTicketName(`${TICKET_NAME} (bad email)`);
        await serviceCasePage.selectDeviceType(DEVICE_TYPE);
        await serviceCasePage.fillAffectedAsset(AFFECTED_ASSET);
        await serviceCasePage.fillDescription(DESCRIPTION);
        await serviceCasePage.fillName(CONTACT_NAME);

        // A well-formed but non-company / non-MSupport email passes client validation
        // yet the backend refuses it on submit and keeps the user on the form.
        await serviceCasePage.fillEmail(UNAUTHORIZED_EMAIL);
        await serviceCasePage.expectSubmitEnabled();
        await serviceCasePage.submit();

        await serviceCasePage.expectEmailNotAuthorized();
    });

    test('MSUP-SERVICECASE-TC007a_Invalid device/asset combination is rejected', async ({
        serviceCasePage,
    }) => {
        // MPURE expects an MPU-prefixed serial; MBS91534 fails the client-side check.
        await serviceCasePage.selectDeviceType(MISMATCH_DEVICE_TYPE);
        await serviceCasePage.fillAffectedAssetAndBlur(MISMATCH_ASSET);
        await serviceCasePage.expectAffectedAssetPrefixError(MISMATCH_PREFIX);
        await serviceCasePage.expectSubmitDisabled();
    });

    test('MSUP-SERVICECASE-TC008a_Manage and remove uploaded file', async ({ serviceCasePage }) => {
        await serviceCasePage.uploadFiles(SUPPORTED_FILE);
        await serviceCasePage.expectFileUploaded(SUPPORTED_FILE_NAME);

        // The document tag can be changed before submission...
        await serviceCasePage.setDocumentTag(SUPPORTED_FILE_NAME, 'Damage Photo');

        // ...and the file can be removed prior to submitting.
        await serviceCasePage.deleteUploadedFile(SUPPORTED_FILE_NAME);
    });

    test('MSUP-SERVICECASE-TC009a_Unsupported file type is not added', async ({ serviceCasePage }) => {
        await serviceCasePage.uploadFiles(UNSUPPORTED_FILE);
        await expect(serviceCasePage.uploadedFileRow(UNSUPPORTED_FILE_NAME)).toHaveCount(0);
    });
});
