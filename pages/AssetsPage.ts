import { Page } from '@playwright/test';

type RowAction = 'delete';

const ACTION_TESTID_PREFIX: Record<RowAction, string> = {
    delete: 'delete-asset-btn-',
};

export class AssetsPage {
    constructor(readonly page: Page) { }

    /** The asset side panel (sheet) that hosts view / edit / MCare details. */
    private sidePanel() {
        return this.page.getByRole('dialog', { name: 'Side panel' });
    }

    /** Open the Asset Info side panel for the first asset row. */
    private async openFirstAssetInfoPanel() {
        const firstRow = this.page.getByRole('row').nth(1);
        await firstRow.waitFor({ state: 'visible', timeout: 10000 });
        await firstRow.getByRole('button', { name: 'Asset Info' }).click();
        await this.sidePanel().waitFor({ state: 'visible', timeout: 15000 });
    }

    async navigateTo() {
        await this.page.goto('/assets');
        await this.page.waitForLoadState('networkidle', { timeout: 20_000 });
    }

    async clickAddNewAsset() {
        await this.page.getByRole('button', { name: 'Add New Asset' }).click();
    }

    async viewFirstAsset() {
        // Open the Asset Info side panel for the first row
        await this.openFirstAssetInfoPanel();

        // Wait for split view to appear (optional stability step)
        await this.page.waitForTimeout(500);

        // Close split view
        const closeBtn = this.sidePanel().getByRole('button', { name: 'Close' }).first();
        await closeBtn.waitFor({ state: 'visible', timeout: 10000 });
        await closeBtn.click();
    }

    async openManageMCareForFirstAsset() {
        // MCare packages are now managed inside the Asset Info side panel.
        await this.openFirstAssetInfoPanel();
        await this.page.getByTestId('asset-tab-mcare').click();
    }

    async editFirstAsset(newLocation: string) {
        // 1. Open the Asset Info side panel for the first row
        await this.openFirstAssetInfoPanel();

        // 2. Click Edit button inside split view
        const editBtn = this.sidePanel().getByRole('button', { name: 'Edit Asset' });
        await editBtn.waitFor({ state: 'visible', timeout: 10000 });
        await editBtn.click();

        // 3. Edit field
        const locationInput = this.sidePanel().getByRole('textbox', { name: 'Location' });
        await locationInput.waitFor({ state: 'visible', timeout: 10000 });
        await locationInput.fill(newLocation);
        await locationInput.press('Tab');

        // 4. Save
        await this.sidePanel().getByRole('button', { name: 'Update Asset' }).click();
    }

    async deleteFirstAsset() {
        await this.openRowAction('delete');
        await this.page.getByRole('button', { name: 'Confirm & Delete' }).click();
    }

    async updateFirstAssetReferenceDate() {
        // 1. Open the Asset Info side panel for the first row
        await this.openFirstAssetInfoPanel();

        const editBtn = this.sidePanel().getByRole('button', { name: 'Edit Asset' });
        await editBtn.waitFor({ state: 'visible', timeout: 10000 });
        await editBtn.click();

        // 2. Find Reference Date section inside the sheet
        const referenceDateGroup = this.sidePanel()
            .getByRole('group')
            .filter({ hasText: 'Reference Date' });

        if (await referenceDateGroup.isVisible({ timeout: 3000 }).catch(() => false)) {
            await referenceDateGroup.getByRole('button').click();

            await this.page
                .locator('[role="gridcell"] button:not([disabled])')
                .first()
                .click();
        } else {
            console.log('⚠️ Reference Date field not visible in split view');
        }

        // 3. Save
        const updateBtn = this.sidePanel().getByRole('button', { name: 'Update Asset' });

        if (await updateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await updateBtn.click();
        } else {
            const nextBtn = this.sidePanel().getByRole('button', {
                name: 'Next',
                exact: true,
            });

            if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                await nextBtn.click();
                await this.sidePanel().getByRole('button', { name: 'Update Asset' }).click();
            } else {
                throw new Error('Could not submit updated Reference Date');
            }
        }

        // Close split view
        const closeBtn = this.sidePanel().getByRole('button', { name: 'Close' }).first();
        await closeBtn.waitFor({ state: 'visible', timeout: 10000 });
        await closeBtn.click();

        await this.page.waitForTimeout(1000);
    }

    /** Open the action menu for the first asset row and click the requested action. */
    private async openRowAction(action: RowAction) {
        const actionBtn = this.page.getByTestId(/action-asset-btn-/).first();
        const actionId = await actionBtn.getAttribute('data-testid');
        if (!actionId) throw new Error('No assets found');

        await actionBtn.click();

        const targetId = actionId.replace('action-asset-btn-', ACTION_TESTID_PREFIX[action]);
        await this.page.getByTestId(targetId).click();
    }
}
