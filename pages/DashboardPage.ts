import { Page, Locator, expect } from '@playwright/test';

const GOTO_TIMEOUT = 60_000;
const DEFAULT_TIMEOUT = 10_000;

// The Dashboard has no data-testid hooks, so sections are anchored to their
// (unique) h3 headings and content is reached via the nearest ancestor card.
export class DashboardPage {
    readonly page: Page;

    // Header
    readonly pageHeading: Locator;
    readonly greeting: Locator;
    readonly focusSummary: Locator;
    readonly serviceFormButton: Locator;
    readonly userInfoButton: Locator;

    // My tickets
    readonly myTicketsHeading: Locator;
    readonly assignedToSubheading: Locator;
    readonly todoChip: Locator;
    readonly waitingInternalChip: Locator;
    readonly waitingExternalChip: Locator;
    readonly openCounterLabel: Locator;
    readonly waitingCounterLabel: Locator;

    // Assets
    readonly assetsHeading: Locator;
    readonly assetsSubheading: Locator;

    // Assets need maintenance
    readonly maintenanceHeading: Locator;
    readonly maintenanceSubheading: Locator;

    // Assets with errors
    readonly assetsErrorsHeading: Locator;
    readonly assetsErrorsSubheading: Locator;

    // Tickets need attention
    readonly ticketsAttentionHeading: Locator;
    readonly ticketsAttentionSubheading: Locator;

    // New tickets
    readonly newTicketsHeading: Locator;
    readonly newTicketsSubheading: Locator;

    // Notifications
    readonly notificationsHeading: Locator;
    readonly notificationsSubheading: Locator;

    constructor(page: Page) {
        this.page = page;

        this.pageHeading = page.getByRole('heading', { name: 'Dashboard', level: 1 });
        this.greeting = page.getByRole('heading', { level: 2 });
        this.focusSummary = page.getByText(
            /\d+ tickets on your desk .* \d+ connected assets/
        );
        this.serviceFormButton = page.getByRole('button', { name: 'Service Form Link' });
        this.userInfoButton = page.getByRole('button', { name: /^Hello,/ });

        this.myTicketsHeading = page.getByRole('heading', { name: 'My tickets', level: 3 });
        this.assignedToSubheading = page.getByText(/^Assigned to /);
        this.todoChip = page.getByText(/^To-Do\s+\d+$/);
        this.waitingInternalChip = page.getByText(/^Waiting Internal\s+\d+$/);
        this.waitingExternalChip = page.getByText(/^Waiting External\s+\d+$/);
        this.openCounterLabel = page.getByText('Open', { exact: true });
        this.waitingCounterLabel = page.getByText('Waiting', { exact: true });

        this.assetsHeading = page.getByRole('heading', { name: 'Assets', exact: true, level: 3 });
        this.assetsSubheading = page.getByText(/Operational state across \d+ connected machines/);

        this.maintenanceHeading = page.getByRole('heading', {
            name: 'Assets need maintenance',
            level: 3,
        });
        this.maintenanceSubheading = page.getByText('Upcoming and overdue maintenance');

        this.assetsErrorsHeading = page.getByRole('heading', {
            name: 'Assets with errors',
            level: 3,
        });
        this.assetsErrorsSubheading = page.getByText('Error, warning, and stopped status');

        this.ticketsAttentionHeading = page.getByRole('heading', {
            name: 'Tickets need attention',
            level: 3,
        });
        this.ticketsAttentionSubheading = page.getByText(/Open tickets gone quiet the longest/);

        this.newTicketsHeading = page.getByRole('heading', {
            name: 'New since you signed in',
            level: 3,
        });
        this.newTicketsSubheading = page.getByText(/Tickets touched during your time away/);

        this.notificationsHeading = page.getByRole('heading', { name: 'Notifications', level: 3 });
        this.notificationsSubheading = page.getByText('Newest at the top');
    }

    async goto() {
        await this.page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: GOTO_TIMEOUT });
        await this.pageHeading.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
    }

    // Nearest ancestor card of a section heading that also holds the section's
    // ticket buttons (accessible names start with the "TM-" reference).
    private ticketSection(heading: Locator): Locator {
        return heading.locator(
            'xpath=ancestor::div[.//button[starts-with(normalize-space(.),"TM-")]][1]'
        );
    }

    private ticketButtons(heading: Locator): Locator {
        return this.ticketSection(heading).getByRole('button', { name: /^TM-/ });
    }

    // Parses a relative "… ago" phrase into an approximate age in minutes so the
    // ordering of time-sorted lists can be asserted.
    private static agoToMinutes(text: string): number | null {
        const match = text.match(
            /(\d+|a|an|less than a)\s*(minute|hour|day|week|month|year)/i
        );
        if (!match) return null;
        const raw = match[1].toLowerCase();
        const value = raw === 'a' || raw === 'an' ? 1 : raw === 'less than a' ? 0 : Number(raw);
        const unit = match[2].toLowerCase();
        const factor: Record<string, number> = {
            minute: 1,
            hour: 60,
            day: 60 * 24,
            week: 60 * 24 * 7,
            month: 60 * 24 * 30,
            year: 60 * 24 * 365,
        };
        return value * factor[unit];
    }

    private async agesFor(buttons: Locator): Promise<number[]> {
        const names = await buttons.evaluateAll((els) =>
            els.map((el) => el.getAttribute('aria-label') || el.textContent || '')
        );
        return names
            .map((n) => DashboardPage.agoToMinutes(n))
            .filter((n): n is number => n !== null);
    }

    // ---- Header ----------------------------------------------------------

    async expectRedirectedToDashboard() {
        await expect(this.page).toHaveURL(/dashboard/);
        await expect(this.pageHeading).toBeVisible();
    }

    async expectGreetingWithName() {
        await expect(this.greeting).toBeVisible();
        await expect(this.greeting).toHaveText(/^Hi .+ - here is where to focus today\.$/);
    }

    async expectFocusSummary() {
        await expect(this.focusSummary).toBeVisible();
        // "<n> tickets on your desk · <n> connected assets · <role>"
        await expect(this.focusSummary).toHaveText(
            /\d+ tickets on your desk .* \d+ connected assets .* \S+/
        );
    }

    async expectUserRoleVisible() {
        // The role is the trailing segment of the focus summary line.
        const text = (await this.focusSummary.textContent()) || '';
        const role = text.split('·').pop()?.trim() || '';
        expect(role.length).toBeGreaterThan(0);
    }

    // ---- My tickets ------------------------------------------------------

    async expectMyTicketsWidget() {
        await expect(this.myTicketsHeading).toBeVisible();
        await expect(this.assignedToSubheading).toBeVisible();
    }

    async expectTicketStatusSummary() {
        await expect(this.todoChip).toBeVisible();
        await expect(this.waitingInternalChip).toBeVisible();
        await expect(this.waitingExternalChip).toBeVisible();
    }

    async expectOpenAndWaitingCounters() {
        await expect(this.openCounterLabel).toBeVisible();
        await expect(this.waitingCounterLabel).toBeVisible();
        const openValue = this.openCounterLabel.locator('xpath=preceding-sibling::p[1]');
        const waitingValue = this.waitingCounterLabel.locator('xpath=preceding-sibling::p[1]');
        await expect(openValue).toHaveText(/^\d+$/);
        await expect(waitingValue).toHaveText(/^\d+$/);
    }

    // ---- Assets ----------------------------------------------------------

    private assetsSection(): Locator {
        // Anchor on the ancestor card that also holds the status grid (the
        // "Unknown" bucket is unique to this widget), not just the header block.
        return this.assetsHeading.locator(
            'xpath=ancestor::div[.//p[normalize-space(.)="Unknown"]][1]'
        );
    }

    async expectAssetsWidget() {
        await expect(this.assetsHeading).toBeVisible();
        await expect(this.assetsSubheading).toBeVisible();
        const section = this.assetsSection();
        for (const status of ['Online', 'Printing', 'Error', 'Offline', 'Unknown']) {
            await expect(section.getByText(status, { exact: true })).toBeVisible();
        }
    }

    async expectAssetPercentageDistribution() {
        const section = this.assetsSection();
        const percentages = section.getByText(/^\d+%$/);
        await expect(percentages.first()).toBeVisible();
        expect(await percentages.count()).toBeGreaterThan(0);
    }

    // ---- Assets need maintenance / errors --------------------------------

    async expectAssetsNeedMaintenanceWidget() {
        await expect(this.maintenanceHeading).toBeVisible();
        await expect(this.maintenanceSubheading).toBeVisible();
    }

    async expectAssetsWithErrorsWidget() {
        await expect(this.assetsErrorsHeading).toBeVisible();
        await expect(this.assetsErrorsSubheading).toBeVisible();
    }

    // ---- Tickets need attention ------------------------------------------

    async expectTicketsNeedAttentionWidget() {
        await expect(this.ticketsAttentionHeading).toBeVisible();
        await expect(this.ticketsAttentionSubheading).toBeVisible();
        await expect(this.ticketButtons(this.ticketsAttentionHeading).first()).toBeVisible();
    }

    // Each ticket card's accessible name bundles ID, name, org · asset and the
    // "… ago" timestamp, so a single regex validates all required fields.
    async expectTicketCardFields(section: 'attention' | 'new') {
        const heading =
            section === 'attention' ? this.ticketsAttentionHeading : this.newTicketsHeading;
        const first = this.ticketButtons(heading).first();
        await expect(first).toHaveAccessibleName(
            /TM-\S+.*(To-Do|In Progress|Waiting Internal|Waiting External|Done|Resolved).*·.*ago$/
        );
    }

    async expectTicketsNeedAttentionOrderedOldestFirst() {
        const ages = await this.agesFor(this.ticketButtons(this.ticketsAttentionHeading));
        for (let i = 1; i < ages.length; i++) {
            expect(ages[i]).toBeLessThanOrEqual(ages[i - 1]);
        }
    }

    // ---- New tickets -----------------------------------------------------

    async expectNewTicketsWidget() {
        await expect(this.newTicketsHeading).toBeVisible();
        await expect(this.newTicketsSubheading).toBeVisible();
        await expect(this.ticketButtons(this.newTicketsHeading).first()).toBeVisible();
    }

    async expectNewTicketsOrderedFreshestFirst() {
        const ages = await this.agesFor(this.ticketButtons(this.newTicketsHeading));
        for (let i = 1; i < ages.length; i++) {
            expect(ages[i]).toBeGreaterThanOrEqual(ages[i - 1]);
        }
    }

    // ---- Notifications ---------------------------------------------------

    private notificationsSection(): Locator {
        return this.notificationsHeading.locator(
            'xpath=ancestor::div[.//button[contains(normalize-space(.)," ago")]][1]'
        );
    }

    private notificationButtons(): Locator {
        return this.notificationsSection().getByRole('button');
    }

    async expectNotificationsWidget() {
        await expect(this.notificationsHeading).toBeVisible();
        await expect(this.notificationsSubheading).toBeVisible();
        await expect(this.notificationButtons().first()).toBeVisible();
    }

    // Each notification exposes its message plus a relative timestamp.
    async expectNotificationFields() {
        const first = this.notificationButtons().first();
        await expect(first).toHaveAccessibleName(/.+ago$/);
    }

    async expectNotificationsOrderedNewestFirst() {
        const ages = await this.agesFor(this.notificationButtons());
        for (let i = 1; i < ages.length; i++) {
            expect(ages[i]).toBeGreaterThanOrEqual(ages[i - 1]);
        }
    }
}
