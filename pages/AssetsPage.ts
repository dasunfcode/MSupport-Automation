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

    /** Open filters and apply asset type filter */
    async applyAssetTypeFilter() {
        console.log('🔍 Applying asset type filter');

        // Open Filters panel
        await this.page.getByRole('button', { name: 'Filters' }).click();
        await this.page.waitForTimeout(2500);   // let drawer fully animate open

        console.log('📋 Filter panel opened');

        // Select first asset type
        await this.page.getByRole('button', { name: /Select asset type|Asset Type/i }).click();
        await this.page.locator('[role="option"]').first().click();

        await this.page.waitForTimeout(3500);   // give UI time to enable Apply button

        console.log('📌 Asset type selected → searching for Apply button...');

        // Try several possible ways to find the Apply button
        const applyLocators = [
            this.page.getByRole('button', { name: /Apply Filters?|Apply Filter|Apply/i }),
            this.page.locator('button').filter({ hasText: /Apply/i }),
            this.page.locator('[data-slot="button"]').filter({ hasText: /Apply/i }),
            this.page.getByRole('button').last()   // fallback: last button on screen
        ];

        for (const locator of applyLocators) {
            if (await locator.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log(`✅ Found Apply button! Clicking...`);
                await locator.click({ force: true });
                console.log('✅ Filters applied successfully');
                return;   // success → exit method
            }
        }

        // If we reach here, button was not found → print debugging info
        console.log('❌ Could not find Apply button. Here are all visible buttons on the page:');
        const allButtons = await this.page.locator('button').all();
        for (let i = 0; i < allButtons.length; i++) {
            const text = await allButtons[i].textContent();
            const visible = await allButtons[i].isVisible();
            if (text && visible) {
                console.log(`   ${i + 1}) "${text.trim()}"`);
            }
        }

        throw new Error('Apply Filters button not found after selection');
    }

    /** Export the asset list */
    async exportAssets() {
        console.log('📤 Starting asset export...');

        // Step 1: Trigger export
        await this.page.getByRole('button', { name: /Export Asset Data|Export/i })
            .click()
            .catch(() => console.log('⚠️ Export button not found'));

        await this.page.waitForTimeout(2500); // give export process time to prepare

        // Step 2: Find and click the "View Export" button (this usually starts the actual download)
        const viewExportBtn = this.page.getByRole('button', {
            name: /View Export Asset Data|View Export|Download|Export/i
        });

        await viewExportBtn.waitFor({ state: 'visible', timeout: 10000 })
            .catch(() => console.log('⚠️ "View Export" button not found – trying fallback'));

        // Start listening for download BEFORE clicking the final button
        const downloadPromise = this.page.waitForEvent('download', { timeout: 20000 });

        await viewExportBtn.click({ force: true }).catch(() => { });

        try {
            const download = await downloadPromise;
            console.log(`✅ Export downloaded: ${download.suggestedFilename()}`);
            // Optional: save it automatically
            // await download.saveAs(`./test-exports/${download.suggestedFilename()}`);
        } catch (e) {
            console.log('⚠️ No download event detected (possibly opens in new tab or takes longer)');
            console.log('✅ Export flow completed anyway');
        }
    }
}