import { Page, Locator, expect } from '@playwright/test';

export type MachineType = 'mpure' | 'mprint';

/**
 * Assets "live" area page object.
 *
 * The assets area was restructured: the side panel ("Asset Info") is now the
 * single entry point for viewing an asset, its related tickets, its live
 * machine data, its hardware logs and its software version. Hardware logs are
 * no longer reachable from a dedicated column button - they live under
 * Service View -> Hardware Logs inside the side panel.
 */
export class AssetsLiveData {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /** The asset side panel (sheet) that hosts every asset detail view. */
    private sidePanel(): Locator {
        return this.page.getByRole('dialog', { name: 'Side panel' });
    }

    async navigateToAssetsPage() {
        await this.page.goto('/assets');
        await this.page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => { });
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

    /** Locate a table row by its asset serial number. */
    private assetRow(serial: string): Locator {
        return this.page.getByRole('row').filter({ hasText: serial }).first();
    }

    /** Open the Asset Info side panel for a specific asset serial number. */
    async openAssetInfoPanel(serial: string) {
        await this.closeSidePanel();
        await this.searchAssetsBySerialNumber(serial);
        await this.assetRow(serial).getByRole('button', { name: 'Asset Info' }).click();
        await this.sidePanel().waitFor({ state: 'visible', timeout: 15000 });
    }

    /** Switch the side panel between its "Asset Info" and "Service View" modes. */
    private async selectPanelMode(mode: 'assetInfo' | 'serviceView') {
        await this.page.getByTestId('asset-panel-mode-select').click();
        await this.page.getByTestId(`asset-panel-mode-option-${mode}`).click();
    }

    /** Open Service View -> Hardware Logs for a specific asset. */
    async openHardwareLogs(serial: string) {
        await this.openAssetInfoPanel(serial);
        await this.selectPanelMode('serviceView');
        await this.page.getByTestId('asset-tab-hardwareLogs').click();

        // Wait for the hardware logs table to render inside the panel.
        await this.sidePanel()
            .getByRole('columnheader', { name: 'ID', exact: true })
            .waitFor({ state: 'visible', timeout: 15000 });

        // Wait for real data rows to replace the loading skeleton (skeleton rows
        // have no "View Details" button).
        await this.sidePanel()
            .getByRole('button', { name: 'View Details' })
            .first()
            .waitFor({ state: 'visible', timeout: 15000 });
    }

    // Method to open Mpure (MPURE / MPU00001) logs
    async openMpureLogs() {
        await this.openHardwareLogs('MPU00001');
    }

    // Method to open Mprint (MPRINT / MPR00001) logs
    async openMprintLogs() {
        await this.openHardwareLogs('MPR00001');
    }

    /** Close the side panel if it is currently open. */
    async closeSidePanel() {
        const panel = this.sidePanel();
        if (await panel.isVisible().catch(() => false)) {
            await panel.getByRole('button', { name: 'Close' }).first().click().catch(() => { });
            await panel.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });
        }
    }

    async verifyHardwareLogs() {
        // Verify the columns of the hardware logs table
        const columns = ['ID', 'Severity', 'Component', 'Error Code', 'Message', 'Timestamp', 'Actions'];
        for (const column of columns) {
            const header: Locator = column === 'Actions'
                ? this.sidePanel().getByRole('columnheader', { name: 'Actions' })
                : this.sidePanel().getByRole('columnheader', { name: column, exact: true });
            await header.first().waitFor({ state: 'visible', timeout: 10000 });
        }

        // Verify the search bar works by searching for the first row's actual ID.
        const firstId = (await this.getColumnValues(0))[0];
        expect(firstId, 'Hardware logs table should contain at least one row').toBeTruthy();

        const searchBar: Locator = this.page.getByRole('textbox', { name: 'Search hardware logs...' });
        await searchBar.waitFor({ state: 'visible', timeout: 10000 });
        await searchBar.fill('');
        await searchBar.focus();
        await searchBar.fill(firstId, { timeout: 10000 });

        await this.sidePanel()
            .getByRole('cell', { name: firstId, exact: true })
            .first()
            .waitFor({ state: 'visible', timeout: 10000 });
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
        const header: Locator = this.sidePanel().getByRole('columnheader', { name: columnName, exact: true });
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
        const rows: Locator = this.sidePanel().getByRole('row');
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
            const pageSizeDropdown: Locator = this.sidePanel().getByRole('combobox');
            await pageSizeDropdown.waitFor({ state: 'visible', timeout: 10000 });
            await pageSizeDropdown.click();
            await this.page.getByRole('option', { name: String(pageSize), exact: true }).click();
            await this.page.waitForTimeout(500);

            // Verify the first page shows exactly the selected number of rows
            const firstPageRowCount = await this.getDataRowCount();
            expect(firstPageRowCount, `Page 1 should have ${pageSize} rows`).toBe(pageSize);
            const firstPageFirstId = (await this.getColumnValues(0))[0];

            // Go to the next page and verify rows again
            const nextButton: Locator = this.sidePanel().getByRole('button', { name: '2', exact: true });
            await nextButton.waitFor({ state: 'visible', timeout: 10000 });
            await nextButton.click();
            await this.page.waitForTimeout(500);

            const secondPageRowCount = await this.getDataRowCount();
            expect(secondPageRowCount, `Page 2 should have up to ${pageSize} rows`).toBeGreaterThan(0);
            expect(secondPageRowCount).toBeLessThanOrEqual(pageSize);

            const secondPageFirstId = (await this.getColumnValues(0))[0];
            expect(secondPageFirstId, 'Page 2 content should differ from page 1').not.toBe(firstPageFirstId);

            // Return to the first page for the next iteration
            const prevButton: Locator = this.sidePanel().getByRole('button', { name: '1', exact: true });
            await prevButton.click();
            await this.page.waitForTimeout(500);
        }
    }

    private async getDataRowCount(): Promise<number> {
        const rows: Locator = this.sidePanel().getByRole('row');
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
    }, _machineType: MachineType) {
        await this.sidePanel().getByRole('button', { name: 'Filters' }).click();

        const filterDialog: Locator = this.page.getByRole('dialog', { name: 'Filter Hardware Logs' });
        await filterDialog.waitFor({ state: 'visible', timeout: 10000 });

        if (filters.severity) {
            await this.selectFilterDropdown('Select severity', filters.severity);
        }
        if (filters.component) {
            await this.selectFilterDropdown('Select component', filters.component);
        }
        if (filters.errorCode) {
            await this.selectFilterDropdown('Select error code', filters.errorCode);
        }
        if (filters.startTimestamp) {
            await this.selectFilterDate('Start date', filters.startTimestamp);
        }
        if (filters.endTimestamp) {
            await this.selectFilterDate('End date', filters.endTimestamp);
        }

        await filterDialog.getByRole('button', { name: 'Apply Filters' }).click();
        await this.page.waitForTimeout(800);

        // Verify the first row matches the selected filters
        const rowCount = await this.getDataRowCount();
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

        // Reset filters after verification. "Clear Filters" resets and closes the dialog.
        await this.sidePanel().getByRole('button', { name: 'Filters' }).click();
        await filterDialog.waitFor({ state: 'visible', timeout: 10000 });
        await filterDialog.getByRole('button', { name: 'Clear Filters' }).click();
        await filterDialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });
    }

    private async selectFilterDropdown(buttonName: string, value: string) {
        const filterDialog: Locator = this.page.getByRole('dialog', { name: 'Filter Hardware Logs' });
        await filterDialog.getByRole('button', { name: buttonName }).click();

        // Each filter opens a searchable command popover. Type to narrow the list,
        // pick the exact option, then close the popover (it stays open on select).
        const combo: Locator = this.page.getByRole('combobox', { expanded: true }).last();
        await combo.waitFor({ state: 'visible', timeout: 10000 });
        await combo.fill(value);
        await this.page.waitForTimeout(300);
        await this.page.getByRole('option', { name: value, exact: true }).first().click();
        await this.page.waitForTimeout(200);
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(200);
    }

    private async selectFilterDate(textboxName: string, value: string) {
        const filterDialog: Locator = this.page.getByRole('dialog', { name: 'Filter Hardware Logs' });
        const dateInput: Locator = filterDialog.getByRole('textbox', { name: textboxName });
        await dateInput.waitFor({ state: 'visible', timeout: 10000 });
        await dateInput.fill(value);
    }
    // End of filter verification methods

    // Method to verify full hardware log view.
    //
    // Always opens the first data row's details — the underlying records change
    // continuously, so the test must not depend on a specific ID, severity, or
    // component. We capture the row's message at runtime and assert the dialog
    // heading matches it.
    async verifyFullHardwareLog(_machineType: MachineType) {
        const firstRow: Locator = this.sidePanel().getByRole('button', { name: 'View Details' }).first();
        await firstRow.waitFor({ state: 'visible', timeout: 10000 });

        const expectedMessage = (await this.getColumnValues(4))[0];
        expect(expectedMessage, 'First row must expose a message to assert against').toBeTruthy();

        await firstRow.click();

        await expect(this.page.getByRole('heading', { name: expectedMessage })).toBeVisible();

        await this.page.getByRole('button', { name: 'Dismiss' }).click();
        await this.page.getByRole('button', { name: 'Close' }).last().click();
    }

    // ==================== NEW ASSET DETAIL VIEWS ====================

    /**
     * Open the Asset Info view for an asset and verify the general information.
     * When the asset has related tickets, they are shown as cards under a
     * "Related Tickets" heading.
     */
    async verifyAssetInfoView(serial: string) {
        await this.openAssetInfoPanel(serial);
        await this.selectPanelMode('assetInfo');
        const panel = this.sidePanel();

        await expect(panel.getByRole('heading', { name: serial, exact: true })).toBeVisible();

        // General Info tab (default)
        await panel.getByTestId('asset-tab-general').click();
        await expect(panel.getByText('Asset Type', { exact: true })).toBeVisible();
        await expect(panel.getByText('(Assigned) Organization', { exact: true })).toBeVisible();

        // Related tickets render as cards only when the asset has any.
        const relatedHeading = panel.getByRole('heading', { name: 'Related Tickets' });
        if (await relatedHeading.isVisible().catch(() => false)) {
            const ticketCards = panel.getByRole('button', { name: /TM-\d+/ });
            expect(await ticketCards.count(), 'Related Tickets section should list ticket cards').toBeGreaterThan(0);
        }

        await this.closeSidePanel();
    }

    /**
     * Open Service View -> Live Data for an asset and verify live machine data
     * is rendered.
     */
    async verifyServiceLiveData(serial: string) {
        await this.openAssetInfoPanel(serial);
        await this.selectPanelMode('serviceView');
        const panel = this.sidePanel();

        await panel.getByRole('button', { name: 'Live Data' }).click();

        await expect(panel.getByText('Last update')).toBeVisible();

        // Live data renders a number of labelled sections/values.
        const sectionCount = await panel.locator('p').count();
        expect(sectionCount, 'Live Data should render machine data sections').toBeGreaterThan(2);

        await this.closeSidePanel();
    }

    /**
     * Trigger the Connect ("Device Link") wizard for an asset, step through it
     * and verify it ends on the "Open Service Tool" step that references the
     * asset serial as the Wi-Fi name.
     */
    async verifyConnectDeviceLink(serial: string) {
        await this.closeSidePanel();
        await this.searchAssetsBySerialNumber(serial);
        await this.assetRow(serial).getByRole('button', { name: 'Connect' }).click();

        const dialog: Locator = this.page.getByRole('dialog').filter({ hasText: 'Device Link' }).first();
        await dialog.waitFor({ state: 'visible', timeout: 10000 });
        await expect(dialog.getByRole('heading', { name: 'Device Link' })).toBeVisible();

        // Advance through the instruction steps until the final step is reached.
        for (let i = 0; i < 5; i++) {
            const continueBtn = dialog.getByRole('button', { name: 'Continue' });
            const canContinue = await continueBtn.isVisible().catch(() => false)
                && await continueBtn.isEnabled().catch(() => false);
            if (!canContinue) break;
            await continueBtn.click();
            await this.page.waitForTimeout(600);
        }

        await expect(dialog.getByRole('button', { name: 'Open Service Tool' })).toBeVisible();
        await expect(dialog.getByText(serial)).toBeVisible();

        await this.page.getByRole('button', { name: 'Close' }).last().click();
        await dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => { });
    }
}
