import { Page, Locator, expect } from '@playwright/test';

export class AssetsLiveData {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigateToAssetsPage() {
        await this.page.goto('/dashboard/assets');
    }

    async searchAssetsBySerialNumber(searchTerm: string) {
        const searchBar: Locator = this.page.getByRole('textbox', { name: 'Search...' });

        // Wait for the search input to be visible
        await searchBar.waitFor({ state: 'visible', timeout: 10000 });

        // Clear any existing value, focus and type the search term with a delay
        await searchBar.fill('');
        await searchBar.focus();
        await searchBar.fill(searchTerm, { timeout: 10000 });

        // Wait until at least one real asset row (with an action button) is rendered
        await this.page
            .getByTestId(/^action-asset-btn-/)
            .first()
            .waitFor({ state: 'visible', timeout: 15000 });
    }

    // Method to open Mpure logs
    async openMpureLogs() {
        await this.openHardwareLogsForMachine('mpure');
    }

    // Method to open Mprint logs
    async openMprintLogs() {
        await this.openHardwareLogsForMachine('mprint');
    }

    /**
     * Opens the hardware logs view for the asset whose row matches the given
     * machine type. The serial number search is fixed at the test level
     * (always '00001'), and rows are disambiguated by the machine-type label
     * rendered in the row — so this works across environments regardless of
     * row ordering or seeded UUIDs.
     */
    private async openHardwareLogsForMachine(machineType: 'mpure' | 'mprint') {
        const machineLabel = machineType === 'mpure' ? /mpure/i : /mprint/i;

        const row: Locator = this.page
            .getByRole('row')
            .filter({ hasText: machineLabel })
            .first();
        await row.waitFor({ state: 'visible', timeout: 15000 });

        const actionButton: Locator = row.getByTestId(/^action-asset-btn-/);
        await actionButton.waitFor({ state: 'visible', timeout: 15000 });
        await actionButton.scrollIntoViewIfNeeded();

        const actionTestId = await actionButton.getAttribute('data-testid');
        if (!actionTestId) {
            throw new Error(`Unable to resolve action button testid for ${machineType} row`);
        }

        const viewTestId = actionTestId.replace('action-asset-btn-', 'view-asset-btn-');
        const viewButton: Locator = this.page.getByTestId(viewTestId);

        // Radix-style dropdowns occasionally swallow the first click while still
        // animating in. Retry until the View item is actually visible.
        await expect(async () => {
            await actionButton.click();
            await expect(viewButton).toBeVisible({ timeout: 2000 });
        }).toPass({ timeout: 10000 });

        await viewButton.click();

        const hardwareLogsButton: Locator = this.page.getByRole('button', { name: 'Hardware Logs' });
        await hardwareLogsButton.waitFor({ state: 'visible', timeout: 10000 });
        await hardwareLogsButton.click();
    }

    async verifyHardwareLogs(searchId: number) {
        // Verify the columns of the hardware logs table
        const columns = ['ID', 'Severity', 'Component', 'Error Code', 'Message', 'Timestamp', 'Actions'];
        for (const column of columns) {
            await this.page.getByRole('columnheader', { name: column, exact: true }).waitFor({ state: 'visible', timeout: 10000 });
        }

        //verify that the search bar is working in hardware logs table
        const searchBar: Locator = this.page.getByRole('textbox', { name: 'Search hardware logs...' });
        const searchTerm = searchId.toString();
        await searchBar.waitFor({ state: 'visible', timeout: 10000 });
        await searchBar.fill('');
        await searchBar.focus();
        await searchBar.fill(searchTerm, { timeout: 10000 });
        const row: Locator = this.page.getByRole('cell', {name: searchTerm});
        await row.first().waitFor({ state: 'visible', timeout: 10000 });
        await searchBar.fill('');
    }

    // Method to verify hardware logs table sorting works
    async verifyHardwareLogsSorting() {
        const columnTypes: { name: string; index: number; type: 'number' | 'date' | 'string' }[] = [
            { name: 'ID', index: 0, type: 'number' },
            { name: 'Severity', index: 1, type: 'string' },
            { name: 'Component', index: 2, type: 'string' },
            { name: 'Error Code', index: 3, type: 'string' },
            { name: 'Message', index: 4, type: 'string' },
            { name: 'Timestamp', index: 5, type: 'date' },
        ];

        for (const col of columnTypes) {
            await this.verifyColumnSort(col.name, col.index, col.type);
        }
    }

    private async verifyColumnSort(
        columnName: string,
        columnIndex: number,
        type: 'number' | 'date' | 'string'
    ) {
        const header: Locator = this.page.getByRole('columnheader', { name: columnName, exact: true });
        const sortButton: Locator = header.getByRole('button').first();
        const clickTarget: Locator = (await sortButton.count()) > 0 ? sortButton : header;

        // Ascending
        await clickTarget.click();
        await this.page.waitForTimeout(500);
        const ascValues = await this.getColumnValues(columnIndex);
        expect(this.isSorted(ascValues, type, 'asc'), `${columnName} should be sorted ascending`).toBe(true);

        // Descending
        await clickTarget.click();
        await this.page.waitForTimeout(500);
        const descValues = await this.getColumnValues(columnIndex);
        expect(this.isSorted(descValues, type, 'desc'), `${columnName} should be sorted descending`).toBe(true);
    }

    private async getColumnValues(columnIndex: number): Promise<string[]> {
        const rows: Locator = this.page.getByRole('row');
        const count = await rows.count();
        const values: string[] = [];
        // Skip header row at index 0
        for (let i = 1; i < count; i++) {
            const cells = rows.nth(i).getByRole('cell');
            if ((await cells.count()) <= columnIndex) continue;
            const text = (await cells.nth(columnIndex).innerText()).trim();
            if (text.length > 0) values.push(text);
        }
        return values;
    }

    private isSorted(
        values: string[],
        type: 'number' | 'date' | 'string',
        order: 'asc' | 'desc'
    ): boolean {
        if (values.length < 2) return true;
        const compare = (a: string, b: string): number => {
            if (type === 'number') return Number(a) - Number(b);
            if (type === 'date') return new Date(a).getTime() - new Date(b).getTime();
            return a.localeCompare(b, undefined, { sensitivity: 'base' });
        };
        for (let i = 1; i < values.length; i++) {
            const cmp = compare(values[i - 1], values[i]);
            if (order === 'asc' && cmp > 0) return false;
            if (order === 'desc' && cmp < 0) return false;
        }
        return true;
    }
    // End of sorting verification methods

    // Method to verify hardware logs table pagination 
    async verifyHardwareLogsPagination() {
        const pageSizes = [5, 10];

        for (const pageSize of pageSizes) {
            // Open the rows-per-page dropdown and pick the page size
            const pageSizeDropdown: Locator = this.page.getByRole('combobox');
            await pageSizeDropdown.waitFor({ state: 'visible', timeout: 10000 });
            await pageSizeDropdown.click();
            await this.page.getByRole('option', { name: String(pageSize), exact: true }).click();
            await this.page.waitForTimeout(500);

            // Verify the first page shows exactly the selected number of rows
            const firstPageRowCount = await this.getDataRowCount();
            expect(firstPageRowCount, `Page 1 should have ${pageSize} rows`).toBe(pageSize);
            const firstPageFirstId = (await this.getColumnValues(0))[0];

            // Go to the next page and verify rows again
            const nextButton: Locator = this.page.getByRole('button').filter({ hasText: /^$/ }).nth(2);
            await nextButton.waitFor({ state: 'visible', timeout: 10000 });
            await nextButton.click();
            await this.page.waitForTimeout(500);

            const secondPageRowCount = await this.getDataRowCount();
            expect(secondPageRowCount, `Page 2 should have up to ${pageSize} rows`).toBeGreaterThan(0);
            expect(secondPageRowCount).toBeLessThanOrEqual(pageSize);

            const secondPageFirstId = (await this.getColumnValues(0))[0];
            expect(secondPageFirstId, 'Page 2 content should differ from page 1').not.toBe(firstPageFirstId);

            // Return to the first page for the next iteration
            const prevButton: Locator = this.page.getByRole('button').filter({ hasText: /^$/ }).nth(1);
            await prevButton.click();
            await this.page.waitForTimeout(500);
        }
    }

    private async getDataRowCount(): Promise<number> {
        const rows: Locator = this.page.getByRole('row');
        // Subtract the header row
        return (await rows.count()) - 1;
    }
    // End of pagination verification methods

    // Method to verify hardware logs table filters
    async verifyHardwareLogFilters(filters: {
        severity?: string;
        component?: string;
        errorCode?: string;
        startTimestamp?: string;
        endTimestamp?: string;
    }, machineType: string) {
        const filterButton: Locator = this.page.getByRole('button', { name: 'Filters' });
        await filterButton.waitFor({ state: 'visible', timeout: 10000 });
        await filterButton.click();

        if (filters.severity) {
            await this.selectFilterDropdown('Severity', filters.severity);
        }
        if (filters.component) {
            await this.selectFilterDropdown('Component', filters.component);
        }
        if (filters.errorCode) {
            await this.selectFilterDropdown('Error Code', filters.errorCode);
        }
        if (filters.startTimestamp) {
            await this.selectFilterDate('Start Date', filters.startTimestamp);
        }
        if (filters.endTimestamp) {
            await this.selectFilterDate('End Date', filters.endTimestamp);
        }

        const applyButton: Locator = this.page.getByRole('button', { name: 'Apply Filters' });
        await applyButton.waitFor({ state: 'visible', timeout: 10000 });
        await applyButton.click();
        await this.page.waitForTimeout(500);

        // Verify the first row matches the selected filters
        const rowCount = await this.getDataRowCount();
        await this.page.waitForTimeout(1000);
        expect(rowCount, 'Filtered results should contain at least one row').toBeGreaterThan(0);

        if (filters.severity) {
            const value = (await this.getColumnValues(1))[0];
            expect(value.toLowerCase()).toContain(filters.severity.toLowerCase());
        }
        if (filters.component) {
            const value = (await this.getColumnValues(2))[0];
            expect(value.toLowerCase()).toContain(filters.component.toLowerCase());
        }
        if (filters.errorCode) {
            const value = (await this.getColumnValues(3))[0];
            expect(value.toLowerCase()).toContain(filters.errorCode.toLowerCase());
        }

        // Reset filters after verification
        if (machineType == '') {
            const resetFiltersButton: Locator = this.page.getByRole('button').nth(5);
            await resetFiltersButton.click();
        } else {
            const resetFiltersButton: Locator = this.page.getByRole('button').filter({ hasText: /^$/ }).first();
            await resetFiltersButton.click();
        }
     }

    private async selectFilterDropdown(label: string, value: string) {
        const dropdown: Locator = this.page.getByRole('button', { name: label });
        await dropdown.waitFor({ state: 'visible', timeout: 10000 });
        await dropdown.click();
        await this.page.getByRole('option', { name: value, exact: true }).click();
        await this.page.keyboard.press('Escape');
    }

    private async selectFilterDate(label: string, value: string) {
        const dateInput: Locator = this.page.getByRole('textbox', { name: label });
        await dateInput.waitFor({ state: 'visible', timeout: 10000 });
        await dateInput.fill(value);
        await dateInput.press('Enter');
    }
    // End of filter verification methods

    // Method to verify full hardware log view.
    //
    // Always opens the first data row's details — the underlying records change
    // continuously, so the test must not depend on a specific ID, severity, or
    // component. We capture the row's message at runtime and assert the dialog
    // heading matches it.
    async verifyFullHardwareLog(_machineType: 'mpure' | 'mprint') {
        const firstRow: Locator = this.page.getByRole('row').nth(1);
        await firstRow.waitFor({ state: 'visible', timeout: 10000 });

        const expectedMessage = (await this.getColumnValues(4))[0];
        expect(expectedMessage, 'First row must expose a message to assert against').toBeTruthy();

        await firstRow.getByLabel('View Details').click();

        await expect(this.page.getByRole('heading', { name: expectedMessage })).toBeVisible();

        await this.page.getByRole('button', { name: 'Dismiss' }).click();
        await this.page.getByRole('button', { name: 'Close' }).click();
    }
}
