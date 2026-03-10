import { Page } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export class AssetsPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /** Go to the Asset Management page */
    async navigateTo() {
        await this.page.goto(`${process.env.BASE_URL}/dashboard/assets`);
        await this.page.waitForLoadState('networkidle', { timeout: 20000 });
        console.log('✅ Opened Asset Management page');
    }

    /** Click the big "Add New Asset" button */
    async clickAddNewAsset() {
        await this.page.getByRole('button', { name: 'Add New Asset' }).click();
        console.log('✅ Clicked Add New Asset');
    }

    /** View the first asset in the table (open + close) */
    async viewFirstAsset() {
        const actionId = await this.page.getByTestId(/action-asset-btn-/).first().getAttribute('data-testid');
        if (!actionId) throw new Error('No assets found');

        await this.page.getByTestId(actionId).click();
        const viewId = actionId.replace('action-asset-btn-', 'view-asset-btn-');
        await this.page.getByTestId(viewId).click();
        await this.page.getByRole('button', { name: 'Close' }).click();
        console.log('✅ Asset viewed successfully');
    }

    /** Open Manage MCare Packages for the first asset */
    async openManageMCareForFirstAsset() {
        const actionId = await this.page.getByTestId(/action-asset-btn-/).first().getAttribute('data-testid');
        if (!actionId) throw new Error('No assets found');

        await this.page.getByTestId(actionId).click();
        const mcareId = actionId.replace('action-asset-btn-', 'manage-mcare-packages-btn-');
        await this.page.getByTestId(mcareId).click();
        console.log('✅ Opened MCare Packages dialog');
    }

    /** Edit the first asset (just changes location) */
    async editFirstAsset(newLocation: string) {
        const actionId = await this.page.getByTestId(/action-asset-btn-/).first().getAttribute('data-testid');
        if (!actionId) throw new Error('No assets found');

        await this.page.getByTestId(actionId).click();
        const editId = actionId.replace('action-asset-btn-', 'edit-asset-btn-');
        await this.page.getByTestId(editId).click();

        console.log(`Editing location to: ${newLocation}`);

        // Wait for edit dialog/form to fully load
        await this.page.waitForTimeout(1500);

        const locationInput = this.page.getByRole('textbox', { name: 'Location' });
        await locationInput.fill(newLocation);
        await locationInput.press('Tab');   // ← Triggers form validation (very important!)

        // Wait until Update button becomes enabled
        const updateBtn = this.page.getByRole('button', { name: 'Update Asset' });
        await updateBtn.waitFor({ state: 'visible', timeout: 10000 });

        try {
            await this.page.waitForFunction(
                () => {
                    const btn = document.querySelector('button:has-text("Update Asset")') as HTMLButtonElement;
                    return btn && !btn.disabled;
                },
                { timeout: 8000 }
            );
            console.log('✅ Update button is now enabled');
        } catch {
            console.log('⚠️ Button still disabled → forcing click');
        }

        await updateBtn.click();
        console.log(`✅ Asset updated with location: ${newLocation}`);
    }

    /** Delete the first asset */
    async deleteFirstAsset() {
        const actionId = await this.page.getByTestId(/action-asset-btn-/).first().getAttribute('data-testid');
        if (!actionId) throw new Error('No assets found');

        await this.page.getByTestId(actionId).click();
        const deleteId = actionId.replace('action-asset-btn-', 'delete-asset-btn-');
        await this.page.getByTestId(deleteId).click();
        await this.page.getByRole('button', { name: 'Confirm & Delete' }).click();
        console.log('✅ Asset deleted successfully');
    }

}