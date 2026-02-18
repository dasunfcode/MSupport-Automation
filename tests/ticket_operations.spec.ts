import { test, expect } from '@playwright/test';

test.describe.serial('Organization CRUD flow', () => {

    test('TC_CRUD_Add_View_Edit_Delete Organization', async ({ page }) => {

        await page.goto('https://qa.msupport.mone.am/dashboard/tickets');
        // ================= ADD =================
        await expect(page.getByText('Add a Ticket')).toBeVisible({ timeout: 15000 });

        await page.getByText('Add a Ticket').click();
        await page.getByLabel('Name').fill(`Test Ticket ${Date.now()}`);
        const ticketTypeSection = page.locator('text=Select Ticket Type').locator('..');

        await ticketTypeSection.getByText('Problem', { exact: true }).click();

        const classifySection = page.locator('text=Classify Issue').locator('..');

        await classifySection.getByText('Failure without downtime', { exact: true }).click();

        // Open dropdown
        await page.getByText('Select asset', { exact: true }).click();

        // Select specific asset
        await page.getByText('MPU99993', { exact: true }).click();

        // Select the textarea by name and fill it
        const description = page.locator('textarea[name="description"]');
        await description.waitFor({ state: 'visible', timeout: 5000 });
        await description.fill('This is an automated description.');

        console.log('Ticket added successfully');
    });
});