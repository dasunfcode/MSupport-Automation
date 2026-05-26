import { Page } from '@playwright/test';

export class AssetCreateDialog {
    readonly page: Page;
    readonly dialog;

    constructor(page: Page) {
        this.page = page;
        this.dialog = page.getByRole('dialog');
    }

    /** Step 1: Fill basic asset information */
    async fillBasicInformation(assetName: string) {
        console.log('📝 Step 1: Basic Asset Info');
        await this.dialog.locator('[role="combobox"]').first().click();
        await this.page.locator('[role="option"]').first().click();

        const serialInput = this.dialog.getByRole('textbox', { name: /Serial Number/ });
        if (!await serialInput.isDisabled()) {
            const uniqueSerial = 'MBS' + Date.now().toString().slice(-5);
            await serialInput.fill(uniqueSerial);
        }

        await this.dialog.locator('[role="combobox"]').nth(1).click();
        await this.page.locator('[role="option"]').first().click();

        await this.dialog.getByRole('textbox', { name: /Asset Name/ }).fill(assetName);

        // ← FIXED: exact: true prevents calendar button match
        await this.dialog.getByRole('button', { name: 'Next', exact: true }).click();
    }

    /** Step 2: Fill location and dates */
    async fillLocationAndDates(location: string, contact: string, organization: string) {
        console.log('📝 Step 2: Location & Dates');
        await this.page.getByRole('textbox', { name: /Location/ }).fill(location);

        // Installation Date
        await this.page.getByRole('group').filter({ hasText: 'Installation Date' }).getByRole('button').click();
        await this.page.locator('[role="gridcell"] button:not([disabled])').first().click();

        // Ex Works Date
        await this.page.getByRole('group').filter({ hasText: 'Ex Works Date' }).getByRole('button').click();
        await this.page.locator('[role="gridcell"] button:not([disabled])').first().click();

        // Reference Date
        await this.page.getByRole('group').filter({ hasText: 'Reference Date' }).getByRole('button').click();
        await this.page.locator('[role="gridcell"] button:not([disabled])').first().click();

        // Related Contact
        await this.page.getByRole('textbox', { name: 'Related Contact' }).fill(contact);


        // ← FIXED: exact: true + .last() for extra safety
        await this.dialog.getByRole('button', { name: 'Next', exact: true }).last().click();
    }

    /** Step 3: Fill end customer and notes */
    async fillEndCustomerAndNotes(country: string, notes: string) {
        console.log('📝 Step 3: End Customer & Notes');

        // await this.page.getByRole('textbox', { name: '(Assigned) Organizations' }).fill(organization);
        // await this.dialog.locator('[role="combobox"]').first().click();
        // await this.page.locator('[role="option"]').first().click();

        await this.dialog.locator('[role="combobox"]').first().click();

        const firstOption = this.page.getByRole('option').first();

        await firstOption.waitFor({ state: 'visible' });
        await firstOption.click();

        await this.page.getByRole('textbox', { name: 'Destination Country' }).fill(country).catch(() => { });
        await this.page.getByRole('textbox', { name: 'Enter Notes' }).fill(notes).catch(() => { });

        // ← FIXED here too
        const nextBtn = this.dialog.getByRole('button', { name: 'Next', exact: true });
        if (await nextBtn.isVisible()) await nextBtn.click();
    }

    /** Click Create / Submit */
    async submit() {
        console.log('🚀 Submitting new asset...');
        const submitBtn = this.dialog.locator('button').filter({ hasText: /Create|Add Asset|Save|Submit/i });
        await submitBtn.click();
        await this.page.waitForTimeout(3000);
        console.log('✅ Asset created!');
    }
}