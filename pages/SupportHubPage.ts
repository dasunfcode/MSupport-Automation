import { Page, Locator, Download, expect } from '@playwright/test';

const GOTO_TIMEOUT = 60_000;
const DEFAULT_TIMEOUT = 10_000;

// Filter chips render only for values that have at least one matching document,
// so keys map to the app's stable data-testid suffixes, e.g.
// data-testid="filter-category-installation".
export type CategoryFilterKey = 'all' | 'installation' | 'maintenance' | 'service';
export type ProductFilterKey =
    | 'all'
    | 'mprint'
    | 'mpure'
    | 'mprintpro'
    | 'mpurepro'
    | 'mpureelite'
    | 'mone';
export type LangFilterKey = 'all' | 'en' | 'de';
export type TypeFilterKey = 'all' | 'manual' | 'training' | 'tool';
type FilterDimension = 'category' | 'product' | 'lang' | 'type';

export class SupportHubPage {
    readonly page: Page;
    readonly navLink: Locator;
    readonly heading: Locator;
    readonly subHeading: Locator;
    readonly searchInput: Locator;
    readonly searchButton: Locator;
    readonly categoryLabel: Locator;
    readonly productLabel: Locator;
    readonly langLabel: Locator;
    readonly typeLabel: Locator;
    readonly cards: Locator;
    readonly previewDialog: Locator;
    readonly previewTitle: Locator;
    readonly previewUpdatedLabel: Locator;
    readonly previewDescription: Locator;
    readonly previewCloseButton: Locator;
    readonly previewViewButton: Locator;
    readonly previewDownloadPdfButton: Locator;
    readonly previewFaqStatus: Locator;
    readonly previewKeywordStatus: Locator;
    readonly previewPdfPrevButton: Locator;
    readonly previewPdfNextButton: Locator;
    readonly previewPdfPageIndicator: Locator;
    readonly emptyStateHeading: Locator;
    readonly userInfoButton: Locator;
    readonly notificationButton: Locator;
    readonly searchClearButton: Locator;
    readonly resultsHeading: Locator;
    readonly rankedByRelevanceLabel: Locator;
    readonly bestAnswerLabel: Locator;
    readonly bestAnswerCard: Locator;
    readonly moreResultsHeading: Locator;
    readonly moreResultsItems: Locator;
    readonly noMatchesHeading: Locator;
    readonly noMatchesMessage: Locator;
    readonly createTicketButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.navLink = page.getByRole('link', { name: 'Support Hub' });
        this.heading = page.getByRole('heading', {
            name: 'Ask a question or search for documentation',
            level: 1,
        });
        this.subHeading = page.getByText(
            'Answers with references to manuals, trainings and tools'
        );
        this.searchInput = page.getByPlaceholder('Search');
        this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
        this.categoryLabel = page.getByText('Category', { exact: true });
        this.productLabel = page.getByText('Product', { exact: true });
        this.langLabel = page.getByText('Lang', { exact: true });
        this.typeLabel = page.getByText('Type', { exact: true });
        this.cards = page.locator('[data-testid^="support-hub-card-"]');
        this.previewDialog = page.getByRole('dialog');
        this.previewTitle = this.previewDialog.getByRole('heading', { level: 2 });
        this.previewUpdatedLabel = this.previewDialog.getByText(/^Updated \d{2}\/\d{2}\/\d{4}/);
        // The description is an (often empty) paragraph immediately after the title.
        this.previewDescription = this.previewTitle.locator('xpath=following-sibling::p[1]');
        this.previewCloseButton = this.previewDialog.getByRole('button', { name: 'Close' });
        this.previewViewButton = this.previewDialog.getByRole('button', { name: 'View', exact: true });
        this.previewDownloadPdfButton = this.previewDialog.getByRole('button', { name: 'Download PDF' });
        // FAQ/Keyword sync status renders as a tooltip trigger holding a check/cross icon plus its label.
        this.previewFaqStatus = this.previewDialog.getByText('FAQs', { exact: true });
        this.previewKeywordStatus = this.previewDialog.getByText('Keywords', { exact: true });
        this.previewPdfPrevButton = this.previewDialog.getByRole('button', { name: '←' });
        this.previewPdfNextButton = this.previewDialog.getByRole('button', { name: '→' });
        this.previewPdfPageIndicator = this.previewDialog.getByText(/^\d+ \/ \d+$/);
        this.emptyStateHeading = page.getByRole('heading', { name: 'No Results Found' });
        this.userInfoButton = page.getByRole('button', { name: /^Hello,/ });
        // The notification icon button has no accessible name; it is the button
        // immediately preceding the logged-in user info button in the top nav.
        this.notificationButton = this.userInfoButton.locator(
            'xpath=preceding-sibling::button[1]'
        );
        // The clear (x) icon only renders once the search box has text; it is a
        // child of the input's grandparent wrapper, not a direct sibling of the input.
        this.searchClearButton = this.searchInput.locator(
            'xpath=../../button[@aria-label="Close"]'
        );
        this.resultsHeading = page.getByRole('heading', { level: 2 }).filter({ hasText: /results?$/ });
        this.rankedByRelevanceLabel = page.getByText('ranked by relevance', { exact: true });
        this.bestAnswerLabel = page.getByText('Best answer', { exact: true });
        // The label is the first child of the highlighted Best Answer card container.
        this.bestAnswerCard = this.bestAnswerLabel.locator('xpath=..');
        this.moreResultsHeading = page.getByRole('heading', { name: 'More results', level: 3 });
        // Result items are the children of the div immediately following the heading.
        this.moreResultsItems = this.moreResultsHeading.locator('xpath=following-sibling::div[1]/*');
        this.noMatchesHeading = page.getByRole('heading', { name: 'No close matches found' });
        this.noMatchesMessage = page.getByText(/couldn.t find a close match/);
        this.createTicketButton = page.getByRole('button', { name: 'Create a ticket' });
    }

    async goto() {
        await this.page.goto('/support-hub', { waitUntil: 'domcontentloaded', timeout: GOTO_TIMEOUT });
        await this.heading.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
    }

    async gotoDashboard() {
        await this.page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    }

    async openFromLeftNav() {
        await this.navLink.click();
        await expect(this.page).toHaveURL(/support-hub/);
        await this.heading.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
    }

    // The app keeps a single browser tab title ("MSupport") across pages;
    // there is no on-page "Support Hub" heading, so we assert on the tab title.
    async expectPageTitleVisible() {
        await expect(this.page).toHaveTitle('MSupport');
    }

    async expectHeadingVisible() {
        await expect(this.heading).toBeVisible();
        await expect(this.subHeading).toBeVisible();
    }

    async expectSearchVisible() {
        await expect(this.searchInput).toBeVisible();
        await expect(this.searchButton).toBeVisible();
    }

    async expectSearchAcceptsInput(term: string) {
        await this.searchInput.fill(term);
        await expect(this.searchInput).toHaveValue(term);
    }

    // Fills the search box and submits it, waiting for the backend response so
    // assertions never race the results refresh.
    async search(term: string) {
        await this.searchInput.fill(term);
        await this.clickFilter(this.searchButton);
    }

    // Clears the search box only; the previous results stay on screen until the
    // cleared query is submitted (see submitSearch/clearSearchAndRestoreDefault).
    async clearSearchInput() {
        await this.searchClearButton.click();
    }

    async clearSearchAndRestoreDefault() {
        await this.clearSearchInput();
        await this.clickFilter(this.searchButton);
    }

    async getResultsCount(): Promise<number> {
        const text = (await this.resultsHeading.textContent()) || '';
        return Number(text.match(/\d+/)?.[0] ?? NaN);
    }

    async expectResultsHeadingVisible() {
        await expect(this.resultsHeading).toBeVisible();
        await expect(this.rankedByRelevanceLabel).toBeVisible();
    }

    // Verifies the highlighted top-ranked result: source/lang/type/product tags,
    // a highlighted answer snippet, the "Matches your search" box and an Open PDF button.
    async expectBestAnswerCardVisible() {
        await expect(this.bestAnswerLabel).toBeVisible();
        await expect(this.bestAnswerCard.locator('mark').first()).toBeVisible();
        await expect(this.bestAnswerCard.getByText('Matches your search', { exact: true })).toBeVisible();
        await expect(this.bestAnswerCard.getByRole('button', { name: /^Open PDF/ })).toBeVisible();
    }

    async expectBestAnswerHasTags(tags: string[]) {
        for (const tag of tags) {
            await expect(this.bestAnswerCard.getByText(tag, { exact: true })).toBeVisible();
        }
    }

    // Clicks a result's "Open PDF" button and returns the new tab it opens,
    // asserting the URL is deep-linked to the referenced page.
    async openResultPdf(card: Locator): Promise<Page> {
        const [popup] = await Promise.all([
            this.page.context().waitForEvent('page'),
            card.getByRole('button', { name: /^Open PDF/ }).click(),
        ]);
        await popup.waitForLoadState('domcontentloaded');
        await expect(popup).toHaveURL(/#page=\d+/);
        return popup;
    }

    async expectMoreResultsVisible() {
        await expect(this.moreResultsHeading).toBeVisible();
        expect(await this.moreResultsItems.count()).toBeGreaterThan(0);
    }

    // Verifies a "More results" item shows a tag set, a highlighted match, a
    // section reference with page number(s), a source file name and an Open PDF button.
    async expectMoreResultsItemPopulated(index: number) {
        const item = this.moreResultsItems.nth(index);
        await expect(item.locator('mark').first()).toBeVisible();
        // Matches both the reference paragraph ("... PDF p.111)") and the
        // "Open PDF p.111" button, so scope to the non-button occurrence.
        await expect(item.getByText(/PDF p\.\d+/).filter({ hasNotText: 'Open PDF' })).toBeVisible();
        await expect(item.getByText(/\.md$/)).toBeVisible();
        await expect(item.getByRole('button', { name: /^Open PDF/ })).toBeVisible();
    }

    async expectNoMatchesState(term: string) {
        await expect(this.noMatchesHeading).toBeVisible();
        await expect(this.noMatchesMessage).toContainText(term);
        await expect(this.createTicketButton).toBeVisible();
        await expect(this.bestAnswerLabel).toBeHidden();
    }

    async expectCategoryFiltersVisible() {
        await expect(this.categoryLabel).toBeVisible();
        await expect(this.filterChip('category', 'all')).toBeVisible();
    }

    async expectProductFiltersVisible() {
        await expect(this.productLabel).toBeVisible();
        await expect(this.filterChip('product', 'all')).toBeVisible();
    }

    async expectLangFiltersVisible() {
        await expect(this.langLabel).toBeVisible();
        await expect(this.filterChip('lang', 'all')).toBeVisible();
    }

    async expectTypeFiltersVisible() {
        await expect(this.typeLabel).toBeVisible();
        await expect(this.filterChip('type', 'all')).toBeVisible();
    }

    async expectTopNavVisible() {
        await expect(this.notificationButton).toBeVisible();
        await expect(this.userInfoButton).toBeVisible();
    }

    filterChip(
        dimension: FilterDimension,
        key: CategoryFilterKey | ProductFilterKey | LangFilterKey | TypeFilterKey
    ): Locator {
        return this.page.getByTestId(`filter-${dimension}-${key}`);
    }

    // Clicks a filter chip and waits for the support-hub search API so
    // assertions never race the backend refresh.
    private async clickFilter(chip: Locator) {
        const responsePromise = this.page
            .waitForResponse((r) => r.url().includes('/api/v1/support-hub/search'), {
                timeout: 20_000,
            })
            .catch(() => undefined);
        await chip.click();
        await responsePromise;
        await this.page.waitForTimeout(300);
    }

    async selectCategory(key: CategoryFilterKey) {
        await this.clickFilter(this.filterChip('category', key));
    }

    async selectProduct(key: ProductFilterKey) {
        await this.clickFilter(this.filterChip('product', key));
    }

    async selectLang(key: LangFilterKey) {
        await this.clickFilter(this.filterChip('lang', key));
    }

    async selectType(key: TypeFilterKey) {
        await this.clickFilter(this.filterChip('type', key));
    }

    async getCardCount(): Promise<number> {
        return this.cards.count();
    }

    async expectCardCount(count: number) {
        await expect(this.cards).toHaveCount(count);
    }

    // Verifies every card currently displayed carries the given category badge,
    // e.g. after filtering by Category = Maintenance.
    async expectAllCardsHaveCategory(label: string) {
        const count = await this.cards.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
            await expect(this.cards.nth(i).getByText(label, { exact: true })).toBeVisible();
        }
    }

    async expectAllCardsHaveProduct(label: string) {
        const count = await this.cards.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
            await expect(this.cards.nth(i).getByText(label, { exact: true })).toBeVisible();
        }
    }

    async expectEmptyState() {
        await expect(this.emptyStateHeading).toBeVisible();
        await expect(this.cards).toHaveCount(0);
    }

    // Verifies a card displays the fields required by the business rules: type
    // badge, category badge, title, FAQ/Keyword sync status and updated date.
    async expectCardFieldsPopulated(index: number) {
        const card = this.cards.nth(index);
        await expect(card.getByRole('heading', { level: 2 })).toBeVisible();
        await expect(card.getByText('FAQs', { exact: true })).toBeVisible();
        await expect(card.getByText('Keywords', { exact: true })).toBeVisible();
        await expect(card.getByText(/^Updated \d{2}\/\d{2}\/\d{4}/)).toBeVisible();
    }

    async openCard(index: number) {
        await this.cards.nth(index).click();
        await expect(this.previewDialog).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    }

    async expectPreviewDialogVisible() {
        await expect(this.previewDialog).toBeVisible();
        await expect(this.previewViewButton).toBeVisible();
        await expect(this.previewDownloadPdfButton).toBeVisible();
    }

    async closePreviewDialog() {
        await this.previewCloseButton.click();
        await expect(this.previewDialog).toBeHidden();
    }

    // Closes via the close (X) icon and verifies the user lands back on the
    // Support Hub card listing (the "landing page" per the business flow).
    async closePreviewDialogAndExpectLandingPage() {
        await this.closePreviewDialog();
        await expect(this.cards.first()).toBeVisible();
    }

    // Verifies the title, updated date, description field and close icon
    // required by the preview modal's business rules.
    async expectPreviewHeaderDetailsVisible() {
        await expect(this.previewTitle).toBeVisible();
        await expect(this.previewUpdatedLabel).toBeVisible();
        // The description paragraph is present in the DOM even when empty for a document.
        await expect(this.previewDescription).toBeAttached();
        await expect(this.previewCloseButton).toBeVisible();
    }

    // Verifies the FAQ/Keyword sync status labels and their check/cross icon.
    async expectPreviewSyncStatusVisible() {
        await expect(this.previewFaqStatus).toBeVisible();
        await expect(this.previewFaqStatus.locator('svg')).toHaveClass(/text-primary|text-destructive/);
        await expect(this.previewKeywordStatus).toBeVisible();
        await expect(this.previewKeywordStatus.locator('svg')).toHaveClass(/text-primary|text-destructive/);
    }

    // Verifies the document preview pane renders with working pagination controls.
    async expectPreviewPdfPaneVisible() {
        await expect(this.previewPdfPageIndicator).toBeVisible();
        await expect(this.previewPdfPageIndicator).toHaveText(/^\d+ \/ \d+$/);
        await expect(this.previewPdfPrevButton).toBeVisible();
        await expect(this.previewPdfNextButton).toBeVisible();
    }

    async getPreviewPdfPage(): Promise<number> {
        const text = (await this.previewPdfPageIndicator.textContent()) ?? '';
        return Number(text.match(/^(\d+)\s\/\s\d+$/)?.[1] ?? NaN);
    }

    // Navigates the preview PDF pane forward and asserts the page counter advanced.
    async goToNextPreviewPdfPage() {
        const before = await this.getPreviewPdfPage();
        await this.previewPdfNextButton.click();
        await expect
            .poll(() => this.getPreviewPdfPage())
            .toBe(before + 1);
    }

    async expectPreviewPdfPrevButtonDisabled() {
        await expect(this.previewPdfPrevButton).toBeDisabled();
    }

    // Clicks Download PDF and waits for the browser download to start.
    async downloadPreviewPdf(): Promise<Download> {
        const [download] = await Promise.all([
            this.page.waitForEvent('download'),
            this.previewDownloadPdfButton.click(),
        ]);
        return download;
    }
}
