import { Page, Locator } from '@playwright/test';
import { AssetsPage } from './AssetsPage';

export class AssetMCareDialog {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /** MCare is now managed inside the asset "Side panel" (MCare and Maintenance tab). */
    private panel(): Locator {
        return this.page.getByRole('dialog', { name: 'Side panel' });
    }

    /** Add a Booked MCare package */
    async addBookedMCare(packageName: string) {
        console.log('Adding MCare package');
        await this.selectPackage(packageName);
        await this.clickAddOrRecover(packageName);

        // Handle "Grace Period Exceeded" confirmation dialog if it appears
        const addAnywayBtn = this.page.getByRole('button', { name: 'Add Anyway' });
        if (await addAnywayBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            console.log('Grace period exceeded — clicking "Add Anyway"');
            await addAnywayBtn.click();
        }
    }

    private async selectPackage(packageName: string) {
        await this.panel().getByRole('combobox').first().click();
        await this.page.getByRole('option', { name: packageName }).click().catch(() =>
            this.page.locator('[role="option"]').first().click()
        );
    }

    private async clickAddOrRecover(packageName: string) {
        const addBtn = this.panel().getByRole('button', { name: 'Add' }).first();
        if (await addBtn.isEnabled().catch(() => false)) {
            await addBtn.click();
            return;
        }

        console.log('Add button disabled — closing MCare dialog and updating Reference Date');
        await this.panel().getByRole('button', { name: 'Close' }).first().click();
        await new AssetsPage(this.page).updateFirstAssetReferenceDate();
        await this.page.waitForTimeout(1000);

        console.log('Reopening MCare dialog for the same asset');
        await new AssetsPage(this.page).openManageMCareForFirstAsset();

        await this.selectPackage(packageName);
        const reopenedAddBtn = this.panel().getByRole('button', { name: 'Add' }).first();
        if (!(await reopenedAddBtn.isEnabled().catch(() => false))) {
            throw new Error('Add button remained disabled after updating Reference Date');
        }
        await reopenedAddBtn.click();
    }

    /** Add Yearly Maintenance date */
    async addYearlyMaintenance() {
        console.log('Adding Yearly Maintenance');

        const randomDays = Math.floor(Math.random() * 30) - 15;

        const randomDate = new Date();
        randomDate.setDate(randomDate.getDate() + randomDays);

        const formattedDate = randomDate.toLocaleDateString('en-GB');

        await this.panel()
            .locator('input[placeholder="DD/MM/YYYY"]')
            .first()
            .fill(formattedDate);

        await this.panel().getByRole('button', { name: 'Add' }).nth(1).click().catch(() => { });
    }

    /** Click Update MCare Packages */
    async update() {
        const updateBtn = this.panel().getByRole('button', { name: 'Update MCare Packages' });
        if (await updateBtn.isEnabled()) {
            await updateBtn.click();
            console.log('MCare packages updated');
        } else {
            await this.panel().getByRole('button', { name: 'Close' }).first().click();
        }
    }
}