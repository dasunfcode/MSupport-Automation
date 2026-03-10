import { Page } from '@playwright/test';

export class AssetMCareDialog {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /** Add a Booked MCare package */
    async addBookedMCare(packageName: string) {
        console.log('📦 Adding MCare package');
        await this.page.getByRole('combobox').first().click();
        await this.page.getByRole('option', { name: packageName }).click().catch(() =>
            this.page.locator('[role="option"]').first().click()
        );
        await this.page.getByRole('button', { name: 'Add' }).first().click().catch(() => { });

        // Handle "Grace Period Exceeded" confirmation dialog if it appears
        const addAnywayBtn = this.page.getByRole('button', { name: 'Add Anyway' });
        if (await addAnywayBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('⚠️ Grace period exceeded — clicking "Add Anyway"');
            await addAnywayBtn.click();
        }
    }

    /** Add Yearly Maintenance date */
    async addYearlyMaintenance() {
        console.log('📅 Adding Yearly Maintenance');
        await this.page.getByRole('button', { name: /DD\/MM\/YYYY/ }).first().click().catch(() => { });
        await this.page.locator('[role="gridcell"] button:not([disabled])').first().click();
        await this.page.getByRole('button', { name: 'Add' }).nth(1).click().catch(() => { });
    }

    /** Click Update MCare Packages */
    async update() {
        const updateBtn = this.page.getByRole('button', { name: 'Update MCare Packages' });
        if (await updateBtn.isEnabled()) {
            await updateBtn.click();
            console.log('✅ MCare packages updated');
        } else {
            await this.page.getByRole('button', { name: 'Close' }).click();
        }
    }
}