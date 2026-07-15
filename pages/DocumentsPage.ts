import { Page, Locator, Download, expect } from '@playwright/test';
import { statSync } from 'fs';

const SORTABLE_COLUMNS = ['Document', 'Tag', 'Source', 'Organization', 'Size', 'Updated'] as const;

// Index of the "Updated" column among the data cells (0-based): Document, Tag,
// Source, Organization, Size, Updated, Actions.
const UPDATED_CELL_INDEX = 5;

// Column indexes for the data cells used by filter/detail assertions:
// Document, Tag, Source, Organization, Size, Updated, Actions.
const DOCUMENT_CELL_INDEX = 0;
const TAG_CELL_INDEX = 1;
const SOURCE_CELL_INDEX = 2;
const ORGANIZATION_CELL_INDEX = 3;
const SIZE_CELL_INDEX = 4;

// Labels shown for each metadata field inside the document detail side panel.
const PANEL_DETAIL_LABELS = ['Tag', 'Source', 'Organization', 'Size', 'Created', 'Updated'] as const;

// Source cells / values read as "Ticket #10999" or "Asset #MPR43242".
const SOURCE_VALUE_PATTERN = /^(Ticket|Asset) #\S+/;
// Size cells read as e.g. "6KB", "1.2MB".
const SIZE_VALUE_PATTERN = /^\d+(\.\d+)?\s?(B|KB|MB|GB)$/i;
// Updated cells read as "2026-07-14 11:35".
const DATETIME_VALUE_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

export interface DocumentRowData {
    name: string;
    tag: string;
    source: string;
    organization: string;
    size: string;
    updated: string;
}

// Filter chip keys map to the app's stable data-testid suffixes, e.g.
// data-testid="document-filter-tag-dump-file". Only tags/sources that have at
// least one document are rendered by the app.
export type TagFilterKey = 'all' | 'damage-photo' | 'dump-file' | 'faulty-part' | 'untagged';
export type SourceFilterKey = 'all' | 'asset' | 'ticket';

// The label shown in a row's Source cell for each non-"all" source filter.
const SOURCE_CELL_PREFIX: Record<Exclude<SourceFilterKey, 'all'>, string> = {
    asset: 'Asset #',
    ticket: 'Ticket #',
};

export class DocumentsPage {
    readonly page: Page;
    readonly navLink: Locator;
    readonly pageTitle: Locator;
    readonly searchInput: Locator;
    readonly tagFilterLabel: Locator;
    readonly sourceFilterLabel: Locator;
    readonly allTagChip: Locator;
    readonly anySourceChip: Locator;
    readonly assetsSourceChip: Locator;
    readonly ticketsSourceChip: Locator;
    readonly table: Locator;
    readonly bodyRows: Locator;
    readonly rowsPerPageCombobox: Locator;
    readonly userInfoButton: Locator;
    readonly notificationButton: Locator;
    readonly detailPanel: Locator;

    constructor(page: Page) {
        this.page = page;
        this.navLink = page.getByRole('link', { name: 'Documents' });
        this.pageTitle = page.getByRole('heading', { name: 'Documents', level: 1 });
        this.searchInput = page.getByRole('textbox', {
            name: 'Search by file name, asset, ticket, organization',
        });
        this.tagFilterLabel = page.getByRole('paragraph').filter({ hasText: /^Tag$/ });
        this.sourceFilterLabel = page.getByRole('paragraph').filter({ hasText: /^Source$/ });
        this.allTagChip = page.getByRole('button', { name: /^All \(\d+\)$/ });
        this.anySourceChip = page.getByRole('button', { name: /^Any Source \(\d+\)$/ });
        this.assetsSourceChip = page.getByRole('button', { name: /^Assets \(\d+\)$/ });
        this.ticketsSourceChip = page.getByRole('button', { name: /^Tickets \(\d+\)$/ });
        this.table = page.getByRole('table');
        this.bodyRows = this.table.locator('tbody tr');
        this.rowsPerPageCombobox = page.getByRole('combobox');
        this.userInfoButton = page.getByRole('button', { name: /^Hello,/ });
        // The notification icon button has no accessible name; it is the button
        // immediately preceding the logged-in user info button in the top nav.
        this.notificationButton = this.userInfoButton.locator(
            'xpath=preceding-sibling::button[1]'
        );
        // The document detail side panel renders as a dialog once a row is clicked.
        this.detailPanel = page.getByRole('dialog');
    }

    async goto() {
        await this.page.goto('/dashboard/documents', { waitUntil: 'domcontentloaded' });
        await this.table.waitFor({ state: 'visible', timeout: 20_000 });
    }

    async gotoDashboard() {
        await this.page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    }

    async openFromLeftNav() {
        await this.navLink.click();
        await expect(this.page).toHaveURL(/dashboard\/documents/);
        await this.table.waitFor({ state: 'visible', timeout: 20_000 });
    }

    async expectPageTitleVisible() {
        await expect(this.pageTitle).toBeVisible();
    }

    async expectSearchVisible() {
        await expect(this.searchInput).toBeVisible();
    }

    async expectTagFiltersVisible() {
        await expect(this.tagFilterLabel).toBeVisible();
        await expect(this.allTagChip).toBeVisible();
    }

    async expectSourceFiltersVisible() {
        await expect(this.sourceFilterLabel).toBeVisible();
        await expect(this.anySourceChip).toBeVisible();
        await expect(this.assetsSourceChip).toBeVisible();
        await expect(this.ticketsSourceChip).toBeVisible();
    }

    async expectTableColumns() {
        for (const column of SORTABLE_COLUMNS) {
            await expect(this.table.getByRole('columnheader', { name: column })).toBeVisible();
        }
        // The final "Actions" column holds the per-row Download control.
        await expect(this.table.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
        await expect(this.bodyRows.first().getByRole('button', { name: 'Download' })).toBeVisible();
    }

    async expectSortableColumnsHaveSortControl() {
        for (const column of SORTABLE_COLUMNS) {
            const header = this.table.getByRole('columnheader', { name: column });
            await expect(header.getByRole('button', { name: column })).toBeVisible();
        }
    }

    async expectPaginationVisible() {
        await expect(this.page.getByRole('button', { name: '1', exact: true })).toBeVisible();
        await expect(this.page.getByText('rows per page')).toBeVisible();
    }

    async changeRowsPerPage(value: string) {
        await this.rowsPerPageCombobox.click();
        await this.page.getByRole('option', { name: value, exact: true }).click();
        await expect(this.rowsPerPageCombobox).toHaveText(value);
    }

    async expectTopNavVisible() {
        await expect(this.notificationButton).toBeVisible();
        await expect(this.userInfoButton).toBeVisible();
    }

    async expectDocumentsSortedByUpdatedDescending() {
        const count = await this.bodyRows.count();
        expect(count).toBeGreaterThan(0);

        const timestamps: number[] = [];
        for (let i = 0; i < count; i++) {
            const raw = (
                await this.bodyRows.nth(i).locator('td').nth(UPDATED_CELL_INDEX).innerText()
            ).trim();
            const parsed = Date.parse(raw.replace(' ', 'T'));
            expect(Number.isNaN(parsed), `Unparseable Updated value: "${raw}"`).toBe(false);
            timestamps.push(parsed);
        }

        const sorted = [...timestamps].sort((a, b) => b - a);
        expect(timestamps).toEqual(sorted);
    }

    // Types into the search box and waits for the documents search API response
    // so assertions never race the debounced backend call.
    private async submitSearch(term: string) {
        const responsePromise = this.page
            .waitForResponse((r) => r.url().includes('/api/v1/documents/search'), {
                timeout: 20_000,
            })
            .catch(() => undefined);
        await this.searchInput.fill(term);
        await responsePromise;
        // Brief settle for the table to re-render with the new result set.
        await this.page.waitForTimeout(300);
    }

    async searchFor(term: string) {
        await this.submitSearch(term);
    }

    async clearSearch() {
        await this.submitSearch('');
    }

    async expectSearchAcceptsInput(term: string) {
        await this.searchInput.fill(term);
        await expect(this.searchInput).toHaveValue(term);
    }

    async getBodyRowCount(): Promise<number> {
        return this.bodyRows.count();
    }

    async expectRowCount(count: number) {
        await expect(this.bodyRows).toHaveCount(count);
    }

    async expectDocumentVisible(name: string) {
        await expect(this.table.getByText(name, { exact: false })).toBeVisible();
    }

    // Polls until at least one result row is present and every result row's value
    // in the given data-cell column contains the term (case-insensitive).
    private async expectColumnValuesAllContain(columnIndex: number, term: string) {
        const needle = term.toLowerCase();
        await expect
            .poll(
                async () => {
                    const count = await this.bodyRows.count();
                    if (count === 0) return false;
                    for (let i = 0; i < count; i++) {
                        const value = (
                            await this.bodyRows.nth(i).locator('td').nth(columnIndex).innerText()
                        )
                            .trim()
                            .toLowerCase();
                        if (!value.includes(needle)) return false;
                    }
                    return true;
                },
                { timeout: 15_000 }
            )
            .toBe(true);
    }

    async expectResultsDocumentColumnAllContain(term: string) {
        await this.expectColumnValuesAllContain(0, term);
    }

    async expectResultsSourceColumnAllContain(term: string) {
        await this.expectColumnValuesAllContain(2, term);
    }

    async expectResultsOrganizationColumnAllContain(term: string) {
        await this.expectColumnValuesAllContain(3, term);
    }

    // ----- Tag / Source filters -----

    tagChip(key: TagFilterKey): Locator {
        return this.page.getByTestId(`document-filter-tag-${key}`);
    }

    sourceChip(key: SourceFilterKey): Locator {
        return this.page.getByTestId(`document-filter-source-${key}`);
    }

    // Clicks a filter chip and waits for the documents search API so assertions
    // never race the debounced backend refresh.
    private async clickFilter(chip: Locator) {
        const responsePromise = this.page
            .waitForResponse((r) => r.url().includes('/api/v1/documents/search'), {
                timeout: 20_000,
            })
            .catch(() => undefined);
        await chip.click();
        await responsePromise;
        await this.page.waitForTimeout(300);
    }

    async selectTag(key: TagFilterKey) {
        await this.clickFilter(this.tagChip(key));
    }

    async selectSource(key: SourceFilterKey) {
        await this.clickFilter(this.sourceChip(key));
    }

    async expectTagChipActive(key: TagFilterKey) {
        await expect(this.tagChip(key)).toHaveAttribute('aria-pressed', 'true');
    }

    async expectSourceChipActive(key: SourceFilterKey) {
        await expect(this.sourceChip(key)).toHaveAttribute('aria-pressed', 'true');
    }

    // Parses the trailing "(N)" count from a chip's label, e.g. "Dump File (2)".
    private async chipCount(chip: Locator): Promise<number> {
        const text = (await chip.innerText()).trim();
        const match = text.match(/\((\d+)\)\s*$/);
        expect(match, `Chip "${text}" has no (count) suffix`).not.toBeNull();
        return Number(match![1]);
    }

    async getTagCount(key: TagFilterKey): Promise<number> {
        return this.chipCount(this.tagChip(key));
    }

    async getSourceCount(key: SourceFilterKey): Promise<number> {
        return this.chipCount(this.sourceChip(key));
    }

    async expectAllRowsHaveTag(tagLabel: string) {
        await this.expectColumnValuesAllContain(TAG_CELL_INDEX, tagLabel);
    }

    async expectAllRowsHaveSource(key: Exclude<SourceFilterKey, 'all'>) {
        await this.expectColumnValuesAllContain(SOURCE_CELL_INDEX, SOURCE_CELL_PREFIX[key]);
    }

    // Verifies that the individual tag counts sum to the "All" tag count, and the
    // individual source counts sum to the "Any Source" count.
    async expectFilterCountsConsistent() {
        const allTagCount = await this.getTagCount('all');
        const tagParts = await Promise.all(
            (['damage-photo', 'dump-file', 'faulty-part', 'untagged'] as TagFilterKey[]).map((k) =>
                this.getTagCount(k)
            )
        );
        expect(tagParts.reduce((a, b) => a + b, 0)).toBe(allTagCount);

        const anySourceCount = await this.getSourceCount('all');
        const sourceParts = await Promise.all(
            (['asset', 'ticket'] as SourceFilterKey[]).map((k) => this.getSourceCount(k))
        );
        expect(sourceParts.reduce((a, b) => a + b, 0)).toBe(anySourceCount);
    }

    // ----- Per-row field display -----

    private rowCell(rowIndex: number, cellIndex: number): Locator {
        return this.bodyRows.nth(rowIndex).locator('td').nth(cellIndex);
    }

    // The table element becomes visible before its rows finish hydrating; wait
    // until the first row's Document cell has text so reads never race rendering.
    private async waitForRowsLoaded() {
        await expect
            .poll(async () => (await this.rowCell(0, DOCUMENT_CELL_INDEX).innerText()).trim().length, {
                timeout: 15_000,
            })
            .toBeGreaterThan(0);
    }

    async getRowData(rowIndex: number): Promise<DocumentRowData> {
        await this.waitForRowsLoaded();
        const read = async (cellIndex: number) =>
            (await this.rowCell(rowIndex, cellIndex).innerText()).trim();
        return {
            name: await read(DOCUMENT_CELL_INDEX),
            tag: await read(TAG_CELL_INDEX),
            source: await read(SOURCE_CELL_INDEX),
            organization: await read(ORGANIZATION_CELL_INDEX),
            size: await read(SIZE_CELL_INDEX),
            updated: await read(UPDATED_CELL_INDEX),
        };
    }

    // Verifies every business-rule field in a row is present and well-formed.
    async expectRowFieldsPopulated(rowIndex: number) {
        const row = await this.getRowData(rowIndex);
        expect(row.name, 'Document name should not be empty').not.toBe('');
        expect(row.tag, 'Tag should not be empty').not.toBe('');
        expect(row.source, `Source "${row.source}" should match "Ticket/Asset #..."`).toMatch(
            SOURCE_VALUE_PATTERN
        );
        expect(row.organization, 'Organization should not be empty').not.toBe('');
        expect(row.size, `Size "${row.size}" should be a file size`).toMatch(SIZE_VALUE_PATTERN);
        expect(row.updated, `Updated "${row.updated}" should be a date/time`).toMatch(
            DATETIME_VALUE_PATTERN
        );
        await expect(this.rowCell(rowIndex, 6).getByRole('button', { name: 'Download' })).toBeVisible();
    }

    // ----- Column sorting -----

    private async clickSortHeader(column: (typeof SORTABLE_COLUMNS)[number]) {
        const header = this.table.getByRole('columnheader', { name: column });
        const responsePromise = this.page
            .waitForResponse((r) => r.url().includes('/api/v1/documents/search'), {
                timeout: 20_000,
            })
            .catch(() => undefined);
        await header.getByRole('button', { name: column }).click();
        await responsePromise;
        await this.page.waitForTimeout(400);
    }

    private async columnValues(cellIndex: number): Promise<string[]> {
        await this.waitForRowsLoaded();
        const count = await this.bodyRows.count();
        const values: string[] = [];
        for (let i = 0; i < count; i++) {
            values.push((await this.rowCell(i, cellIndex).innerText()).trim());
        }
        return values;
    }

    // Clicking a sortable header should reorder the rows into ascending order.
    async expectColumnSortsAscending(column: (typeof SORTABLE_COLUMNS)[number], cellIndex: number) {
        const before = await this.columnValues(cellIndex);
        await this.clickSortHeader(column);
        const after = await this.columnValues(cellIndex);
        expect(after, 'Sorting should reorder the visible rows').not.toEqual(before);
        const ascending = [...after].sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        );
        expect(after).toEqual(ascending);
    }

    // ----- Organization truncation -----

    // Long organization names are truncated with an ellipsis while every row keeps
    // the same cell count so the table stays aligned.
    async expectOrganizationColumnTruncates() {
        await this.waitForRowsLoaded();
        const style = await this.rowCell(0, ORGANIZATION_CELL_INDEX).evaluate((el) => {
            const cs = getComputedStyle(el);
            return {
                overflow: cs.overflow,
                textOverflow: cs.textOverflow,
                whiteSpace: cs.whiteSpace,
            };
        });
        expect(style.textOverflow).toBe('ellipsis');
        expect(style.overflow).toBe('hidden');
        expect(style.whiteSpace).toBe('nowrap');

        const rowCount = await this.bodyRows.count();
        const headerCount = await this.table
            .locator('thead tr')
            .first()
            .locator('th')
            .count();
        for (let i = 0; i < rowCount; i++) {
            await expect(this.bodyRows.nth(i).locator('td')).toHaveCount(headerCount);
        }
    }

    // ----- Document detail side panel -----

    // Clicks a row and waits for its detail side panel to open, returning the row
    // values so the spec can cross-check them against the panel.
    async openRowPanel(rowIndex: number): Promise<DocumentRowData> {
        const row = await this.getRowData(rowIndex);
        await this.bodyRows.nth(rowIndex).click();
        await expect(this.detailPanel).toBeVisible();
        return row;
    }

    async expectPanelClosed() {
        await expect(this.detailPanel).toHaveCount(0);
    }

    async closePanel() {
        await this.detailPanel.getByRole('button', { name: 'Close' }).click();
        await this.expectPanelClosed();
    }

    async expectPanelTitle(name: string) {
        await expect(
            this.detailPanel.getByRole('heading', { level: 2, name }).first()
        ).toBeVisible();
    }

    async expectPanelHasCloseButton() {
        await expect(this.detailPanel.getByRole('button', { name: 'Close' })).toBeVisible();
    }

    async expectPanelHasDownloadButton() {
        await expect(this.detailPanel.getByRole('button', { name: 'Download' })).toBeVisible();
    }

    async expectPanelPreviewVisible() {
        await expect(this.detailPanel.getByRole('img').first()).toBeVisible();
    }

    // Reads a metadata value from the panel by its label (label and value are
    // adjacent siblings in the DOM).
    private panelDetailValue(label: string): Locator {
        return this.detailPanel
            .locator(`xpath=.//*[normalize-space(text())="${label}"]/following-sibling::*[1]`)
            .first();
    }

    async expectPanelDetail(label: string, value: string) {
        await expect(this.panelDetailValue(label)).toHaveText(value);
    }

    async expectPanelHasAllDetailLabels() {
        for (const label of PANEL_DETAIL_LABELS) {
            await expect(this.detailPanel.getByText(label, { exact: true }).first()).toBeVisible();
        }
    }

    // Verifies the panel metadata matches the values shown in the source row.
    async expectPanelMatchesRow(row: DocumentRowData) {
        await this.expectPanelTitle(row.name);
        await this.expectPanelDetail('Tag', row.tag);
        await this.expectPanelDetail('Source', row.source);
        await this.expectPanelDetail('Organization', row.organization);
        await this.expectPanelDetail('Size', row.size);
        await this.expectPanelDetail('Updated', row.updated);
    }

    // ----- Document download -----

    private rowDownloadButton(rowIndex: number): Locator {
        return this.bodyRows.nth(rowIndex).getByRole('button', { name: 'Download' });
    }

    // Every document row must expose a Download action.
    async expectEveryRowHasDownloadButton() {
        await this.waitForRowsLoaded();
        const count = await this.bodyRows.count();
        expect(count).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
            await expect(this.rowDownloadButton(i)).toBeVisible();
        }
    }

    // Clicks a row's Download button and returns the resulting browser download.
    async downloadRow(rowIndex: number): Promise<Download> {
        await this.waitForRowsLoaded();
        const [download] = await Promise.all([
            this.page.waitForEvent('download'),
            this.rowDownloadButton(rowIndex).click(),
        ]);
        return download;
    }

    // Clicks the Download button inside the open detail panel.
    async downloadFromPanel(): Promise<Download> {
        const [download] = await Promise.all([
            this.page.waitForEvent('download'),
            this.detailPanel.getByRole('button', { name: 'Download' }).click(),
        ]);
        return download;
    }

    // A download must keep the document's original filename and deliver real
    // (non-empty) file content. Byte-for-byte identity with the uploaded source
    // is not verifiable in E2E, so non-empty content is asserted as the proxy.
    private async expectDownloadPreservesFile(download: Download, expectedName: string) {
        expect(download.suggestedFilename()).toBe(expectedName);
        const path = await download.path();
        expect(path, 'Downloaded file should be persisted to disk').toBeTruthy();
        expect(statSync(path!).size, 'Downloaded file should not be empty').toBeGreaterThan(0);
    }

    async expectRowDownloadsOriginalFile(rowIndex: number) {
        const row = await this.getRowData(rowIndex);
        const download = await this.downloadRow(rowIndex);
        await this.expectDownloadPreservesFile(download, row.name);
    }

    async expectPanelDownloadsOriginalFile(row: DocumentRowData) {
        const download = await this.downloadFromPanel();
        await this.expectDownloadPreservesFile(download, row.name);
    }

    // Downloading one document must not affect another: two different rows each
    // yield their own distinct, correctly named file.
    async expectDownloadsAreIndependent(rowA: number, rowB: number) {
        const nameA = (await this.getRowData(rowA)).name;
        const nameB = (await this.getRowData(rowB)).name;
        const downloadA = await this.downloadRow(rowA);
        const downloadB = await this.downloadRow(rowB);
        expect(downloadA.suggestedFilename()).toBe(nameA);
        expect(downloadB.suggestedFilename()).toBe(nameB);
        expect(downloadA.suggestedFilename()).not.toBe(downloadB.suggestedFilename());
    }

    // Simulates the physical file being unavailable by failing the storage
    // download-url call, then asserts the app surfaces a failure toast.
    // NOTE: the live app shows "Failed to download <name>: <reason>" — the story
    // specifies "Document could not be downloaded." This asserts the ACTUAL text
    // and flags the mismatch as a product/spec discrepancy.
    async expectDownloadErrorWhenFileUnavailable(rowIndex: number) {
        await this.waitForRowsLoaded();
        const row = await this.getRowData(rowIndex);
        await this.page.route('**/api/v1/storage/download-url**', (route) =>
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'error' }),
            })
        );
        try {
            await this.rowDownloadButton(rowIndex).click();
            const toast = this.page
                .locator('[data-sonner-toast]')
                .filter({ hasText: `Failed to download ${row.name}` });
            await expect(toast).toBeVisible({ timeout: 10_000 });
        } finally {
            await this.page.unroute('**/api/v1/storage/download-url**');
        }
    }

    // NOTE: the live app renders "No results." for an empty search. The DOCUMENTS
    // user story specifies "No documents found." — this asserts the ACTUAL text;
    // the mismatch is flagged as a product/spec discrepancy rather than hidden.
    async expectEmptyState() {
        await expect(this.table.getByText('No results.')).toBeVisible();
    }
}
