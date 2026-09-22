import path from 'path';
import { test, expect } from '../fixtures/fixtures';

// ==================== EASY-TO-CHANGE TEST DATA ====================
// A valid tracking link generated during Service Case creation. Override via env.
const CASE_ID = process.env.TRACKING_CASE_ID || 'a05338dc-bed3-4b8a-8bff-7ce1c9ea5365';
const TOKEN =
    process.env.TRACKING_TOKEN ||
    'FD16Aj7mfdWmjI5mlwg860Q4zOKiF7O635Jj1AUA3zh6Mrr5OcWqWCXwsr7q67WHvUgdsGsCGuilDMdZWCAnwvnqQIXvbrYB0w35z65LMgY2KClGjcsUVpRkmtZj5YkM';

// Requester details associated with the Service Case (from the Contact panel).
const CONTACT_NAME = 'QA Automation';
const CONTACT_COMPANY = 'One Click Metal';
const CONTACT_EMAIL = 'tharusha@fcodelabs.com';

// Reply validation inputs.
const INVALID_EMAIL = 'not-an-email';

// Optional attachment for a reply (allowed type: .html).
const SUPPORTED_FILE = path.resolve(__dirname, '../data/uploads/sample.html');

test.describe.serial('MSUP Service Case Tracking (public tracking link)', () => {
    test.describe('Valid tracking link', () => {
        test.beforeEach(async ({ serviceCaseTrackingPage }) => {
            await serviceCaseTrackingPage.goto(CASE_ID, TOKEN);
            await serviceCaseTrackingPage.expectLoaded();
        });

        test('MSUP-SERVICE_CASE_TRACKING-TC001a_Access without authentication', async ({
            serviceCaseTrackingPage,
        }) => {
            // A valid tracking URL renders the ticket for an anonymous user (no login).
            await serviceCaseTrackingPage.expectReferenceFormat();
            await serviceCaseTrackingPage.expectTitleVisible();
        });

        test('MSUP-SERVICE_CASE_TRACKING-TC002a_Personal tracking link security notice', async ({
            serviceCaseTrackingPage,
        }) => {
            await serviceCaseTrackingPage.expectSecurityNotice();
        });

        test('MSUP-SERVICE_CASE_TRACKING-TC003a_Header shows reference, status and type', async ({
            serviceCaseTrackingPage,
        }) => {
            await serviceCaseTrackingPage.expectReferenceFormat();
            await serviceCaseTrackingPage.expectStatusBadgeVisible();
            await serviceCaseTrackingPage.expectTypeBadgeVisible();
            await serviceCaseTrackingPage.expectTitleVisible();
        });

        test('MSUP-SERVICE_CASE_TRACKING-TC004a_Summary information is displayed', async ({
            serviceCaseTrackingPage,
        }) => {
            // Type, Device Type, Serial Number, Assigned To, Priority, Created, Last Updated.
            await serviceCaseTrackingPage.expectSummaryFieldsVisible();
        });

        test('MSUP-SERVICE_CASE_TRACKING-TC005a_Progress panel highlights workflow', async ({
            serviceCaseTrackingPage,
        }) => {
            await serviceCaseTrackingPage.expectProgress('Ticket created');
        });

        test('MSUP-SERVICE_CASE_TRACKING-TC006a_Contact panel shows requester details', async ({
            serviceCaseTrackingPage,
        }) => {
            await serviceCaseTrackingPage.expectContact(CONTACT_NAME, CONTACT_COMPANY, CONTACT_EMAIL);
        });

        test('MSUP-SERVICE_CASE_TRACKING-TC007a_Communication timeline is displayed', async ({
            serviceCaseTrackingPage,
        }) => {
            // The timeline groups user messages, support replies and system-generated events.
            await expect(serviceCaseTrackingPage.historyHeading).toBeVisible();
            // System-generated status changes are visually distinct from user messages.
            await expect(
                serviceCaseTrackingPage.page.getByText(/Status changed:/).first(),
            ).toBeVisible();
        });

        test('MSUP-SERVICE_CASE_TRACKING-TC008a_All panels render on the tracking page', async ({
            serviceCaseTrackingPage,
        }) => {
            await serviceCaseTrackingPage.expectPanelsVisible();
            await expect(serviceCaseTrackingPage.addMessageHeading).toBeVisible();
            await expect(serviceCaseTrackingPage.emailInput).toBeVisible();
            await expect(serviceCaseTrackingPage.messageInput).toBeVisible();
            await expect(serviceCaseTrackingPage.uploadZone).toBeVisible();
            await expect(serviceCaseTrackingPage.submitButton).toBeVisible();
        });

        test('MSUP-SERVICE_CASE_TRACKING-TC009a_Reply requires email and message', async ({
            serviceCaseTrackingPage,
        }) => {
            await serviceCaseTrackingPage.submit();
            await serviceCaseTrackingPage.expectReplyError('Email address is required');
            await serviceCaseTrackingPage.expectReplyError('Comment cannot be empty');
        });

        test('MSUP-SERVICE_CASE_TRACKING-TC009b_Reply rejects an invalid email', async ({
            serviceCaseTrackingPage,
        }) => {
            // The reply form only re-validates on change after the first submit attempt,
            // so submit once to arm validation, then enter a malformed email.
            await serviceCaseTrackingPage.submit();
            await serviceCaseTrackingPage.fillEmail(INVALID_EMAIL);
            await serviceCaseTrackingPage.fillMessage('Tracking reply with a bad email');
            await serviceCaseTrackingPage.expectReplyError(
                'Please enter a valid email address from your company domain or an MSupport user email.',
            );
        });

        test('MSUP-SERVICE_CASE_TRACKING-TC010a_Submit a reply with attachment', async ({
            serviceCaseTrackingPage,
        }) => {
            const message = `Automated tracking reply ${Date.now()}`;
            await serviceCaseTrackingPage.submitReply(CONTACT_EMAIL, message, SUPPORTED_FILE);
            // The reply is immediately added to the communication timeline.
            await serviceCaseTrackingPage.expectReplyInTimeline(message);
        });

        test('MSUP-SERVICE_CASE_TRACKING-TC011a_Renders on desktop, tablet and mobile', async ({
            serviceCaseTrackingPage,
        }) => {
            const viewports = [
                { width: 1280, height: 720 }, // desktop
                { width: 768, height: 1024 }, // tablet
                { width: 375, height: 812 }, // mobile
            ];
            for (const viewport of viewports) {
                await serviceCaseTrackingPage.page.setViewportSize(viewport);
                await serviceCaseTrackingPage.expectSecurityNotice();
                await serviceCaseTrackingPage.expectTitleVisible();
                await expect(serviceCaseTrackingPage.submitButton).toBeVisible();
            }
        });
    });

    test.describe('Exceptional cases', () => {
        test('MSUP-SERVICE_CASE_TRACKING-TC012a_Invalid or expired token is rejected', async ({
            serviceCaseTrackingPage,
        }) => {
            await serviceCaseTrackingPage.goto(CASE_ID, 'INVALIDTOKEN123');
            await serviceCaseTrackingPage.expectLoadError();
        });

        test('MSUP-SERVICE_CASE_TRACKING-TC012b_Unknown Service Case is not found', async ({
            serviceCaseTrackingPage,
        }) => {
            await serviceCaseTrackingPage.goto('00000000-0000-0000-0000-000000000000', TOKEN);
            await serviceCaseTrackingPage.expectLoadError();
        });
    });
});
