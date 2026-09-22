import { Page, Locator, expect } from '@playwright/test';

const GOTO_TIMEOUT = 60_000;
const DEFAULT_TIMEOUT = 10_000;

/** Statuses a Service Case can display in the tracking header badge. */
export type TrackingStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

/**
 * Page Object for the public Service Case Tracking page.
 *
 * Lives on the form host (https://qa.form.msupport.am/service-case/<caseId>?token=<token>)
 * and is reachable anonymously via a personal tracking link that carries a secret
 * token. No authentication is required. When the browser happens to carry an
 * mSupport session a "session detected" dialog is shown first; goto() dismisses it
 * by continuing as an Anonymous User so the page behaves as it would for a real
 * link recipient.
 *
 * The page is read-only apart from the "Add Message" reply form at the bottom.
 */
export class ServiceCaseTrackingPage {
    readonly page: Page;

    // Header / summary
    readonly securityNotice: Locator;
    readonly headerBadges: Locator;
    readonly referenceBadge: Locator;
    readonly title: Locator;

    // Panels
    readonly relatedFilesHeading: Locator;
    readonly progressHeading: Locator;
    readonly contactHeading: Locator;
    readonly historyHeading: Locator;

    // Reply form ("Add Message")
    readonly addMessageHeading: Locator;
    readonly emailInput: Locator;
    readonly messageInput: Locator;
    readonly fileInput: Locator;
    readonly uploadZone: Locator;
    readonly submitButton: Locator;

    // Error state
    readonly loadError: Locator;
    readonly goBackButton: Locator;

    constructor(page: Page) {
        this.page = page;

        this.securityNotice = page.getByText('You are accessing this ticket via a personal tracking link');
        // The three status badges sit in the div immediately preceding the H1 title.
        this.headerBadges = page.locator('h1').locator('xpath=preceding-sibling::div[1]');
        this.referenceBadge = page.getByText(/^TM-\d+$/);
        this.title = page.getByRole('heading', { level: 1 });

        this.relatedFilesHeading = page.getByRole('heading', { name: 'Related Files', level: 2 });
        this.progressHeading = page.getByRole('heading', { name: 'Progress', level: 2 });
        this.contactHeading = page.getByRole('heading', { name: 'Contact', level: 2 });
        this.historyHeading = page.getByRole('heading', { name: 'History & Communication', level: 2 });

        this.addMessageHeading = page.getByRole('heading', { name: 'Add Message', level: 3 });
        this.emailInput = page.getByPlaceholder('Your email address');
        this.messageInput = page.getByPlaceholder('Write a reply or additional information...');
        this.fileInput = page.locator('#file-upload-files');
        this.uploadZone = page.getByText('Drag and Drop or Click Here to upload files');
        this.submitButton = page.getByRole('button', { name: 'Submit' });

        this.loadError = page.getByText('Failed to load service case details');
        this.goBackButton = page.getByRole('button', { name: 'Go Back' });
    }

    /** Base URL of the public form host (overridable via FORM_BASE_URL). */
    private static get formBaseUrl(): string {
        return process.env.FORM_BASE_URL || 'https://qa.form.msupport.am';
    }

    static trackingUrl(caseId: string, token: string): string {
        return `${ServiceCaseTrackingPage.formBaseUrl}/service-case/${caseId}?token=${token}`;
    }

    /** Opens a tracking link and, if prompted, continues as an anonymous user. */
    async goto(caseId: string, token: string) {
        await this.page.goto(ServiceCaseTrackingPage.trackingUrl(caseId, token), {
            waitUntil: 'domcontentloaded',
            timeout: GOTO_TIMEOUT,
        });
        await this.dismissSessionDialogIfPresent();
    }

    /**
     * When the browser carries an mSupport session the tracking page first asks how
     * to continue; a genuine link recipient is anonymous, so choose that option.
     */
    async dismissSessionDialogIfPresent() {
        const anonymous = this.page.getByRole('radio', { name: 'Continue as Anonymous User' });
        try {
            await anonymous.waitFor({ state: 'visible', timeout: 3_000 });
        } catch {
            return;
        }
        await anonymous.click();
        await this.page.getByRole('button', { name: 'Confirm' }).click();
    }

    // ---------------------------------------------------------------- loaded state

    /** Waits for the tracking page to render (security notice + title). */
    async expectLoaded() {
        await expect(this.securityNotice).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(this.title).toBeVisible();
    }

    /** Verifies the private-link security warning is shown. */
    async expectSecurityNotice() {
        await expect(this.securityNotice).toBeVisible();
        await expect(this.securityNotice).toContainText('Do not share this link publicly');
    }

    /** Returns the Service Case reference (e.g. "TM-11223") from the header badge. */
    async getReference(): Promise<string> {
        await expect(this.referenceBadge).toBeVisible();
        return ((await this.referenceBadge.textContent()) ?? '').trim();
    }

    async expectReferenceFormat() {
        await expect(this.referenceBadge).toHaveText(/^TM-\d+$/);
    }

    /** The status badge lives in the header badge row next to the reference. */
    async expectStatus(status: TrackingStatus) {
        await expect(this.headerBadges).toContainText(status);
    }

    async expectType(type: string) {
        await expect(this.headerBadges).toContainText(type);
    }

    /** Asserts the header shows a valid status badge without pinning to volatile data. */
    async expectStatusBadgeVisible() {
        await expect(this.headerBadges).toContainText(/Open|Assigned|In Progress|Resolved|Closed/);
    }

    /** Asserts the header shows a valid Service Case type badge. */
    async expectTypeBadgeVisible() {
        await expect(this.headerBadges).toContainText(/Problem|Request|Feedback|Question|Other/);
    }

    async expectTitle(title: string) {
        await expect(this.title).toHaveText(title);
    }

    /** The title is dynamic; assert it renders with non-empty text. */
    async expectTitleVisible() {
        await expect(this.title).toBeVisible();
        await expect(this.title).not.toHaveText('');
    }

    // ---------------------------------------------------------------- summary panel

    /** The value paragraph shown next to a summary label (label <p> + value <p>). */
    summaryValue(label: string): Locator {
        return this.page.getByText(label, { exact: true }).locator('xpath=following-sibling::p[1]');
    }

    /** Asserts a summary field's label is present and, optionally, its value. */
    async expectSummaryField(label: string, value?: string) {
        await expect(this.page.getByText(label, { exact: true }).first()).toBeVisible();
        if (value !== undefined) {
            await expect(this.summaryValue(label).first()).toHaveText(value);
        }
    }

    /** Verifies the key summary fields listed in the acceptance criteria are visible. */
    async expectSummaryFieldsVisible() {
        for (const label of ['Type', 'Device Type', 'Serial Number', 'Assigned To', 'Priority', 'Created', 'Last Updated']) {
            await expect(this.page.getByText(label, { exact: true }).first()).toBeVisible();
        }
    }

    // ---------------------------------------------------------------- panels

    async expectPanelsVisible() {
        await expect(this.progressHeading).toBeVisible();
        await expect(this.contactHeading).toBeVisible();
        await expect(this.historyHeading).toBeVisible();
        await expect(this.relatedFilesHeading).toBeVisible();
    }

    /** Verifies the Progress panel is shown and highlights a workflow stage. */
    async expectProgress(stage: string) {
        await expect(this.progressHeading).toBeVisible();
        await expect(this.page.getByText(stage, { exact: true }).first()).toBeVisible();
    }

    /** Verifies the Contact panel exposes the requester's details. */
    async expectContact(name: string, company: string, email: string) {
        const contactPanel = this.contactHeading.locator('xpath=following-sibling::div[1]');
        await expect(contactPanel.getByText(name, { exact: true })).toBeVisible();
        await expect(contactPanel.getByText(company, { exact: true })).toBeVisible();
        await expect(contactPanel.getByRole('link', { name: email })).toBeVisible();
    }

    // ---------------------------------------------------------------- reply form

    async fillEmail(email: string) {
        await this.emailInput.fill(email);
    }

    async fillMessage(message: string) {
        await this.messageInput.fill(message);
    }

    async attachFiles(paths: string | string[]) {
        await this.fileInput.setInputFiles(paths);
    }

    async submit() {
        await this.submitButton.click();
    }

    /** Fills the reply form (optionally attaching files) and submits it. */
    async submitReply(email: string, message: string, files?: string | string[]) {
        await this.fillEmail(email);
        await this.fillMessage(message);
        if (files) {
            await this.attachFiles(files);
        }
        await this.submit();
    }

    /** A field-level validation error under the reply form. */
    async expectReplyError(message: string | RegExp) {
        await expect(this.page.getByText(message).first()).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    }

    /** Verifies a submitted reply appears in the communication timeline and clears the form. */
    async expectReplyInTimeline(message: string) {
        await expect(this.page.getByText(message).first()).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(this.emailInput).toHaveValue('');
        await expect(this.messageInput).toHaveValue('');
    }

    // ---------------------------------------------------------------- error state

    /** Verifies the invalid/expired/not-found error screen with the Go Back action. */
    async expectLoadError() {
        await expect(this.loadError).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(this.goBackButton).toBeVisible();
    }
}
