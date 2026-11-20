import { Page, Locator, expect } from '@playwright/test';

const GOTO_TIMEOUT = 60_000;
const DEFAULT_TIMEOUT = 10_000;

// Assets are split into one widget per product family, each with its own set
// of status buckets (zero counts are still rendered).
const ASSET_FAMILY_STATUSES: Record<string, string[]> = {
    'MPRINT / MPRINTpro': ['Printing', 'Error', 'Offline', 'Idle', 'Preparing', 'Unknown'],
    'MPURE / MPUREpro / MPURElite': ['Online', 'Offline', 'Unknown'],
};

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
    readonly newTicketsEmptyState: Locator;

    // Notifications
    readonly notificationsHeading: Locator;
    readonly notificationsSubheading: Locator;
    readonly notificationsEmptyState: Locator;

    // Setup not finalized
    readonly setupHeading: Locator;
    readonly setupSubheading: Locator;
    readonly setupCountBadge: Locator;
    readonly setupCard: Locator;
    readonly setupList: Locator;
    readonly setupRows: Locator;
    readonly setupAssetTableLink: Locator;

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

        this.maintenanceHeading = page.getByRole('heading', {
            name: 'Assets need maintenance',
            level: 3,
        });
        this.maintenanceSubheading = page.getByText('Overdue, upcoming or unscheduled maintenance');

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
        this.newTicketsEmptyState = page.getByText('No new tickets since your last active time.');

        this.notificationsHeading = page.getByRole('heading', { name: 'Notifications', level: 3 });
        this.notificationsSubheading = page.getByText('Newest at the top');
        this.notificationsEmptyState = page.getByText('No unread notifications right now.');

        this.setupHeading = page.getByRole('heading', { name: 'Setup not finalized', level: 3 });
        // End customer is mandatory on asset creation, so the live subtitle omits it.
        this.setupSubheading = page.getByText(/^Missing installation date(,| or) installation report/);
        this.setupCountBadge = page.getByTestId('setup-not-finalized-count');
        this.setupCard = this.setupCountBadge.locator('xpath=ancestor::div[@data-slot="card"][1]');
        this.setupList = this.setupCard.locator('.overflow-y-auto').first();
        // Row containers are "setup-incomplete-<uuid>"; their children reuse the
        // prefix with a suffix, so keep only the elements that hold an age cell.
        this.setupRows = this.setupCard
            .locator('[data-testid^="setup-incomplete-"]')
            .filter({ has: page.locator('[data-testid$="-age"]') });
        this.setupAssetTableLink = this.setupCard.getByRole('link', {
            name: 'View in the asset table',
        });
    }

    async goto() {
        await this.page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: GOTO_TIMEOUT });
        await this.pageHeading.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
    }

    // Buttons whose closest preceding h3 is the given section heading. Scoping by
    // document order (not by ancestor card) keeps an empty section from picking
    // up a neighbouring section's buttons.
    private sectionButtons(headingText: string): Locator {
        return this.page.locator(
            `xpath=//button[preceding::h3[1][normalize-space(.)="${headingText}"]]`
        );
    }

    // Ticket buttons' accessible names start with the "TM-" reference.
    private ticketButtons(headingText: string): Locator {
        return this.sectionButtons(headingText).filter({ hasText: /^TM-/ });
    }

    // Parses a relative "… ago" phrase into an approximate age in minutes so the
    // ordering of time-sorted lists can be asserted. Only a phrase that ends in
    // "ago" and starts on a word boundary counts, so digits elsewhere on the card
    // (an asset such as MPR00001 run together with "35 minutes ago") are ignored.
    private static agoToMinutes(text: string): number | null {
        const match = text.trim().match(
            /\b(less than a|\d+|an?)\s+(minute|hour|day|week|month|year)s?\s+ago$/i
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
        // Read the age element itself; the button's full text runs the asset and
        // the age together ("MPR00001" + "35 minutes ago" -> "...0000135 minutes ago").
        const names = await buttons.evaluateAll((els) =>
            els.map((el) =>
                el.querySelector('[data-slot="tooltip-trigger"]')?.textContent ||
                el.getAttribute('aria-label') ||
                el.textContent ||
                ''
            )
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

    assetFamilyHeading(family: string): Locator {
        return this.page.getByRole('heading', { name: family, exact: true, level: 3 });
    }

    private assetFamilySection(family: string): Locator {
        // Anchor on the ancestor card that also holds the status grid (every
        // family widget has an "Unknown" bucket), not just the header block.
        return this.assetFamilyHeading(family).locator(
            'xpath=ancestor::div[.//p[normalize-space(.)="Unknown"]][1]'
        );
    }

    async expectAssetsWidget() {
        for (const [family, statuses] of Object.entries(ASSET_FAMILY_STATUSES)) {
            await expect(this.assetFamilyHeading(family)).toBeVisible();
            const section = this.assetFamilySection(family);
            await expect(
                section.getByText(/^Operational state across \d+ connected machines$/)
            ).toBeVisible();
            for (const status of statuses) {
                await expect(section.getByText(status, { exact: true })).toBeVisible();
            }
        }
    }

    async expectAssetPercentageDistribution() {
        for (const family of Object.keys(ASSET_FAMILY_STATUSES)) {
            const percentages = this.assetFamilySection(family).getByText(/^\d+%$/);
            await expect(percentages.first()).toBeVisible();
            expect(await percentages.count()).toBe(ASSET_FAMILY_STATUSES[family].length);
        }
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
        await expect(this.ticketButtons('Tickets need attention').first()).toBeVisible();
    }

    // Each ticket card's accessible name bundles ID, name, org · asset and the
    // "… ago" timestamp, so a single regex validates all required fields.
    async expectTicketCardFields(section: 'attention' | 'new') {
        const heading =
            section === 'attention' ? 'Tickets need attention' : 'New since you signed in';
        const first = this.ticketButtons(heading).first();
        await expect(first).toHaveAccessibleName(
            /TM-\S+.*(To-Do|In Progress|Waiting Internal|Waiting External|Done|Resolved).*·.*ago$/
        );
    }

    async expectTicketsNeedAttentionOrderedOldestFirst() {
        const ages = await this.agesFor(this.ticketButtons('Tickets need attention'));
        for (let i = 1; i < ages.length; i++) {
            expect(ages[i]).toBeLessThanOrEqual(ages[i - 1]);
        }
    }

    // ---- New tickets -----------------------------------------------------

    // The list only holds tickets touched since the last sign-in, so it is
    // legitimately empty right after a fresh login.
    async hasNewTickets(): Promise<boolean> {
        await this.expectNewTicketsWidget();
        return (await this.ticketButtons('New since you signed in').count()) > 0;
    }

    async expectNewTicketsWidget() {
        await expect(this.newTicketsHeading).toBeVisible();
        await expect(this.newTicketsSubheading).toBeVisible();
        await expect(
            this.ticketButtons('New since you signed in').first().or(this.newTicketsEmptyState)
        ).toBeVisible();
    }

    async expectNewTicketsOrderedFreshestFirst() {
        const ages = await this.agesFor(this.ticketButtons('New since you signed in'));
        for (let i = 1; i < ages.length; i++) {
            expect(ages[i]).toBeGreaterThanOrEqual(ages[i - 1]);
        }
    }

    // ---- Notifications ---------------------------------------------------

    private notificationButtons(): Locator {
        return this.sectionButtons('Notifications').filter({ hasText: / ago$/ });
    }

    // Only unread notifications are listed, so the widget can be empty.
    async hasNotifications(): Promise<boolean> {
        await this.expectNotificationsWidget();
        return (await this.notificationButtons().count()) > 0;
    }

    async expectNotificationsWidget() {
        await expect(this.notificationsHeading).toBeVisible();
        await expect(this.notificationsSubheading).toBeVisible();
        await expect(
            this.notificationButtons().first().or(this.notificationsEmptyState)
        ).toBeVisible();
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

    // ---- Setup not finalized ---------------------------------------------

    private setupSerial(row: Locator): Locator {
        return row.locator('[data-testid$="-serial"]');
    }

    private setupAge(row: Locator): Locator {
        return row.locator('[data-testid$="-age"]');
    }

    private setupMeta(row: Locator): Locator {
        // "<machine type> · <end customer>" sits next to the serial button.
        return this.setupSerial(row).locator('xpath=following-sibling::span[1]');
    }

    setupChips(row: Locator): Locator {
        return row.locator('[data-testid$="-installation-date"], [data-testid$="-installation-report"], [data-testid$="-end-customer"]');
    }

    /** First row that carries the given chip, or null when no row is missing that item. */
    async setupRowWithChip(chip: 'installation-date' | 'installation-report'): Promise<Locator | null> {
        await this.waitForSetupList();
        const row = this.setupRows
            .filter({ has: this.page.locator(`[data-testid$="-${chip}"]`) })
            .first();
        return (await row.count()) > 0 ? row : null;
    }

    // The badge renders before the rows, so wait until both agree before
    // deciding whether the list is empty.
    async waitForSetupList() {
        await expect(this.setupCountBadge).toHaveText(/^\d+$/, { timeout: DEFAULT_TIMEOUT });
        const badge = Number(await this.setupCountBadge.innerText());
        await expect(this.setupRows).toHaveCount(badge, { timeout: DEFAULT_TIMEOUT });
    }

    async setupRowCount(): Promise<number> {
        await this.waitForSetupList();
        return this.setupRows.count();
    }

    async expectSetupNotFinalizedSection() {
        await expect(this.setupHeading).toBeVisible();
        await expect(this.setupSubheading).toBeVisible();
    }

    async expectSetupCountBadge() {
        await expect(this.setupCountBadge).toBeVisible();
        await expect(this.setupCountBadge).toHaveText(/^\d+$/);
    }

    // The badge counts every machine in the user's scope, and every one of
    // them is listed (no paging), so the badge must equal the rendered rows.
    async expectSetupCountMatchesRows() {
        await expect(this.setupCountBadge).toHaveText(/^\d+$/);
        const badge = Number(await this.setupCountBadge.innerText());
        await expect(this.setupRows).toHaveCount(badge);
    }

    async expectSetupEmptyState() {
        await expect(this.setupCountBadge).toHaveText('0');
        await expect(this.setupRows).toHaveCount(0);
        await expect(this.setupAssetTableLink).toBeVisible();
    }

    async expectEveryRowHasAMissingItem() {
        const rows = await this.setupRows.all();
        for (const row of rows) {
            expect(await this.setupChips(row).count()).toBeGreaterThan(0);
        }
    }

    async expectAssetTableLinkVisible() {
        await expect(this.setupAssetTableLink).toBeVisible();
        await expect(this.setupAssetTableLink).toHaveAttribute('href', '/assets');
    }

    async openAssetTableFromSetupSection() {
        await this.setupAssetTableLink.click();
        await expect(this.page).toHaveURL(/\/assets$/);
        await expect(
            this.page.getByRole('heading', { name: 'Asset Management', level: 1 })
        ).toBeVisible();
    }

    async expectSetupRowsSortedLongestIncompleteFirst() {
        const ages = (await this.setupRows.locator('[data-testid$="-age"]').allInnerTexts()).map(
            (t) => Number(t.match(/^(\d+)\s*d$/)?.[1])
        );
        expect(ages.every((a) => Number.isFinite(a))).toBe(true);
        for (let i = 1; i < ages.length; i++) {
            expect(ages[i]).toBeLessThanOrEqual(ages[i - 1]);
        }
    }

    // The card has a fixed CSS height; extra rows overflow into the inner
    // list, which scrolls without resizing the card.
    async expectSetupSectionFixedHeightAndScrollable() {
        await expect(this.setupList).toHaveCSS('overflow-y', /auto|scroll/);
        const before = await this.setupCard.boundingBox();
        const { scrollHeight, clientHeight } = await this.setupList.evaluate((el) => ({
            scrollHeight: el.scrollHeight,
            clientHeight: el.clientHeight,
        }));
        if (scrollHeight > clientHeight) {
            await this.setupList.evaluate((el) => el.scrollTo(0, el.scrollHeight));
            await expect
                .poll(() => this.setupList.evaluate((el) => el.scrollTop))
                .toBeGreaterThan(0);
            // The last row is reachable by scrolling inside the section.
            await expect(this.setupRows.last()).toBeInViewport();
        }
        const after = await this.setupCard.boundingBox();
        expect(after?.height).toBe(before?.height);
    }

    async expectSetupRowFields() {
        const rows = await this.setupRows.all();
        expect(rows.length).toBeGreaterThan(0);
        for (const row of rows) {
            const serial = this.setupSerial(row);
            await expect(serial).toHaveText(/^[A-Z]+\d+$/);
            await expect(serial).toHaveCSS('font-weight', '700');
            // Machine type · end customer (or "not handed over yet").
            await expect(this.setupMeta(row)).toHaveText(/^\S+ · .+$/);
            await expect(this.setupAge(row)).toHaveText(/^\d+ d$/);
        }
    }

    // One chip per missing item, labelled from the fixed set, never duplicated.
    async expectSetupChipLabels() {
        const allowed: Record<string, RegExp> = {
            'installation-date': /^Installation date\s*Enter Date$/,
            'installation-report': /^Installation report\s*(Upload|Signature pending)$/,
            'end-customer': /^End customer\s*Assign$/,
        };
        const rows = await this.setupRows.all();
        for (const row of rows) {
            const chips = await this.setupChips(row).all();
            expect(chips.length).toBeGreaterThanOrEqual(1);
            expect(chips.length).toBeLessThanOrEqual(3);
            const kinds: string[] = [];
            for (const chip of chips) {
                const testId = (await chip.getAttribute('data-testid')) || '';
                const kind = Object.keys(allowed).find((k) => testId.endsWith(`-${k}`))!;
                kinds.push(kind);
                await expect(chip).toHaveAccessibleName(allowed[kind]);
            }
            expect(new Set(kinds).size).toBe(kinds.length);
        }
    }

    // Read-only by design: the section contains no editable controls.
    async expectSetupSectionHasNoEditableFields() {
        await expect(
            this.setupCard.locator('input, textarea, select, [contenteditable="true"]')
        ).toHaveCount(0);
    }

    // ---- Setup not finalized: navigation ---------------------------------

    private assetSidePanel(serial: string): Locator {
        return this.page.getByRole('dialog', { name: serial, exact: true });
    }

    /** Clicks the given part of the row and asserts the asset opens on the Documents tab. */
    async openSetupRowAndExpectDocumentsTab(row: Locator, target: 'serial' | 'row' | 'installation-report') {
        const serial = (await this.setupSerial(row).innerText()).trim();
        const clickTarget =
            target === 'serial'
                ? this.setupSerial(row)
                : target === 'row'
                    ? this.setupAge(row)
                    : row.locator('[data-testid$="-installation-report"]');
        await clickTarget.click();

        const panel = this.assetSidePanel(serial);
        await expect(panel).toBeVisible({ timeout: 15_000 });
        await expect(panel.getByRole('button', { name: 'Documents', exact: true })).toHaveAttribute(
            'aria-pressed',
            'true'
        );
        await expect(panel.getByRole('heading', { name: 'Installation Report', level: 3 })).toBeVisible();
    }

    /** The Installation date chip opens the asset's general-info edit form with the date empty. */
    async openInstallationDateChipAndExpectGeneralInfo(row: Locator) {
        const serial = (await this.setupSerial(row).innerText()).trim();
        await row.locator('[data-testid$="-installation-date"]').click();

        const editDialog = this.page.getByRole('dialog').filter({
            has: this.page.getByRole('heading', { name: 'Edit Asset', level: 2 }),
        });
        await expect(editDialog).toBeVisible({ timeout: 15_000 });
        await expect(editDialog.getByRole('textbox', { name: 'Serial Number *' })).toHaveValue(serial);
        const dateGroup = editDialog.getByRole('group').filter({ hasText: 'Installation Date' });
        await expect(dateGroup.getByRole('textbox', { name: 'DD/MM/YYYY' })).toBeEditable();
        await expect(dateGroup.getByRole('textbox', { name: 'DD/MM/YYYY' })).not.toHaveValue(
            /\d{2}\/\d{2}\/\d{4}/
        );
    }

    // ---- Setup not finalized: responsive ---------------------------------

    async expectSetupChipsWrapOnNarrowScreen() {
        const row = this.setupRows
            .filter({ has: this.page.locator('[data-testid$="-installation-date"]') })
            .filter({ has: this.page.locator('[data-testid$="-installation-report"]') })
            .first();
        const tops = await this.setupChips(row).evaluateAll((els) =>
            els.map((el) => Math.round(el.getBoundingClientRect().top))
        );
        expect(new Set(tops).size).toBeGreaterThan(1);
        // Nothing in the section overflows horizontally.
        const overflow = await this.setupCard.evaluate((el) => el.scrollWidth - el.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);
    }

    async hasSetupRowWithBothChips(): Promise<boolean> {
        await this.waitForSetupList();
        return (
            (await this.setupRows
                .filter({ has: this.page.locator('[data-testid$="-installation-date"]') })
                .filter({ has: this.page.locator('[data-testid$="-installation-report"]') })
                .count()) > 0
        );
    }
}
