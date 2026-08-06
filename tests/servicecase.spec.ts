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
const CONTACT_EMAIL = 'qa.automation@example.com';
const INVALID_EMAIL = 'not-an-email';

// Verified live in the QA form.
const DEVICE_TYPE = 'MPURE';
const AFFECTED_ASSET = 'MPU00001';
const COMPANY_SEARCH = 'One click metal';
const COMPANY_OPTION = 'One Click Metal';

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
        await serviceCasePage.selectAffectedAsset(AFFECTED_ASSET);
        await serviceCasePage.fillDescription(DESCRIPTION);

        await serviceCasePage.fillName(CONTACT_NAME);
        await serviceCasePage.selectCompany(COMPANY_SEARCH, COMPANY_OPTION);
        await serviceCasePage.fillEmail(CONTACT_EMAIL);

        // Attach a supporting file and classify it before submitting.
        await serviceCasePage.uploadFiles(SUPPORTED_FILE);
        await serviceCasePage.expectFileUploaded(SUPPORTED_FILE_NAME);
        await serviceCasePage.setDocumentTag(SUPPORTED_FILE_NAME, 'Faulty Part');

        await serviceCasePage.expectSubmitEnabled();
        await serviceCasePage.submit();

        const reference = await serviceCasePage.expectSubmissionConfirmed(CONTACT_EMAIL);
        expect(Number(reference)).toBeGreaterThan(0);
    });

    test('MSUP-SERVICECASE-TC002a_Ticket type is single-select', async ({ serviceCasePage }) => {
        await serviceCasePage.selectTicketType('Problem');
        await serviceCasePage.expectOnlyTicketTypeSelected('Problem');

        // Selecting a new type must clear the previously selected one.
        await serviceCasePage.selectTicketType('Feedback');
        await serviceCasePage.expectOnlyTicketTypeSelected('Feedback');
    });

    test('MSUP-SERVICECASE-TC003a_Affected Asset disabled until Device Type selected', async ({
        serviceCasePage,
    }) => {
        await serviceCasePage.expectAffectedAssetDisabled();
        await serviceCasePage.selectDeviceType(DEVICE_TYPE);
        await serviceCasePage.expectAffectedAssetMandatory();
    });

    test('MSUP-SERVICECASE-TC004a_Mandatory fields prevent submission', async ({ serviceCasePage }) => {
        // With an empty form the Submit button stays disabled.
        await serviceCasePage.expectSubmitDisabled();

        // Touching then clearing the Ticket Name surfaces the required error.
        await serviceCasePage.touchAndClearTicketName();
        await serviceCasePage.expectFieldError('Ticket name is required.');
    });

    test('MSUP-SERVICECASE-TC004b_Invalid email is rejected', async ({ serviceCasePage }) => {
        await serviceCasePage.fillEmailAndBlur(INVALID_EMAIL);
        await serviceCasePage.expectFieldError('Enter a valid email address.');
    });

    test('MSUP-SERVICECASE-TC005a_Manage and remove uploaded file', async ({ serviceCasePage }) => {
        await serviceCasePage.uploadFiles(SUPPORTED_FILE);
        await serviceCasePage.expectFileUploaded(SUPPORTED_FILE_NAME);

        // The document tag can be changed before submission...
        await serviceCasePage.setDocumentTag(SUPPORTED_FILE_NAME, 'Damage Photo');

        // ...and the file can be removed prior to submitting.
        await serviceCasePage.deleteUploadedFile(SUPPORTED_FILE_NAME);
    });

    test('MSUP-SERVICECASE-TC006a_Unsupported file type is not added', async ({ serviceCasePage }) => {
        await serviceCasePage.uploadFiles(UNSUPPORTED_FILE);
        await expect(serviceCasePage.uploadedFileRow(UNSUPPORTED_FILE_NAME)).toHaveCount(0);
    });

    test('MSUP-SERVICECASE-TC007a_Missing company is rejected by the backend', async ({
        serviceCasePage,
    }) => {
        // Company is visually optional (no red asterisk, Submit enables), but the
        // backend requires it and rejects the submission with a validation toast.
        await serviceCasePage.selectTicketType('Problem');
        await serviceCasePage.fillTicketName(`${TICKET_NAME} (no company)`);
        await serviceCasePage.selectDeviceType(DEVICE_TYPE);
        await serviceCasePage.selectAffectedAsset(AFFECTED_ASSET);
        await serviceCasePage.fillDescription(DESCRIPTION);
        await serviceCasePage.fillName(CONTACT_NAME);
        await serviceCasePage.fillEmail(CONTACT_EMAIL);

        await serviceCasePage.expectSubmitEnabled();
        await serviceCasePage.submit();

        await serviceCasePage.expectToast('Contact organization ID must be a valid UUID');
        await expect(serviceCasePage.page).toHaveURL(/\/ticket-form$/);
    });
});
