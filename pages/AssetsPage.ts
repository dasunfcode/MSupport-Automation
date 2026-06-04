import { Page } from '@playwright/test';

type RowAction = 'view' | 'edit' | 'delete' | 'manage-mcare-packages';

const ACTION_TESTID_PREFIX: Record<RowAction, string> = {
    view: 'view-asset-btn-',
    edit: 'edit-asset-btn-',
    delete: 'delete-asset-btn-',
    'manage-mcare-packages': 'manage-mcare-packages-btn-',
};

export class AssetsPage {
    constructor(readonly page: Page) {}

    async navigateTo() {
        await this.page.goto('/dashboard/assets');
        await this.page.waitForLoadState('networkidle', { timeout: 20_000 });
    }

    async clickAddNewAsset() {
        await this.page.getByRole('button', { name: 'Add New Asset' }).click();
    }

    async viewFirstAsset() {
        await this.openRowAction('view');
        await this.page.getByRole('button', { name: 'Close' }).click();
    }

    async openManageMCareForFirstAsset() {
        await this.openRowAction('manage-mcare-packages');
    }

    async editFirstAsset(newLocation: string) {
        await this.openRowAction('edit');

        const locationInput = this.page.getByRole('textbox', { name: 'Location' });
        await locationInput.fill(newLocation);
        await locationInput.press('Tab'); // trigger form validation

        await this.page.getByRole('button', { name: 'Update Asset' }).click();
    }

    async deleteFirstAsset() {
        await this.openRowAction('delete');
        await this.page.getByRole('button', { name: 'Confirm & Delete' }).click();
    }

    async updateFirstAssetReferenceDate() {
        await this.openRowAction('edit');

        const referenceDateGroup = this.page.getByRole('group').filter({ hasText: 'Reference Date' });
        if (await referenceDateGroup.isVisible({ timeout: 3000 }).catch(() => false)) {
            await referenceDateGroup.getByRole('button').click();
            await this.page.locator('[role="gridcell"] button:not([disabled])').first().click();
        } else {
            console.log('⚠️ Reference Date field not visible in edit form');
        }

        const updateBtn = this.page.getByRole('button', { name: 'Update Asset' });
        if (await updateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await updateBtn.click();
        } else {
            const nextBtn = this.page.getByRole('button', { name: 'Next', exact: true });
            if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                await nextBtn.click();
                await this.page.getByRole('button', { name: 'Update Asset' }).click();
            } else {
                throw new Error('Could not submit updated Reference Date');
            }
        }

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
