import { test, expect } from '@playwright/test';
import { time } from 'node:console';

test.describe.serial('Ticket CRUD flow', () => {

    test('TC003_CRUD_Add_View_Edit_Delete Ticket', async ({ page }) => {

        // ================= DEFINE TEST DATA =================
        const ticketName = `Test Ticket ${Date.now()}`;
        const updatedTicketName = `${ticketName} Updated`;

        // ================= ADD =================
        await page.goto(`${process.env.BASE_URL}/dashboard/tickets`);

        await expect(page.getByText('Add a Ticket')).toBeVisible({ timeout: 15000 });
        await page.getByText('Add a Ticket').click();

        await page.getByLabel('Name').fill(ticketName);

        const ticketTypeSection = page.locator('text=Select Ticket Type').locator('..');
        await ticketTypeSection.getByText('Problem', { exact: true }).click();

        const classifySection = page.locator('text=Classify Issue').locator('..');
        await classifySection.getByText('Failure without downtime', { exact: true }).click();

        await page.getByText('Select asset', { exact: true }).click();
        await page.getByText('MPU99993', { exact: true }).click();

        await page.locator('textarea[name="description"]').fill('This is an automated description.');

        await page.getByRole('button', { name: 'Create Ticket' }).click();
        console.log('Ticket added successfully');

        // ================= VIEW =================
        await page.goto(`${process.env.BASE_URL}/dashboard/tickets`);
        const searchInput = page.getByPlaceholder('Search by Ticket ID, Name, Type...');
        await searchInput.clear();
        await searchInput.fill(ticketName);

        const ticketRow = page.locator('tr', { hasText: ticketName });
        await expect(ticketRow).toBeVisible({ timeout: 10000 });
        console.log('Ticket viewed successfully (ticket:', ticketName, ')');

        // ================= EDIT =================
        // await page.waitForTimeout(5000);
        await ticketRow.getByRole('button', { name: 'Open menu' }).click();
        await ticketRow.getByRole('button', { name: 'Open menu' }).click();

        await page.getByRole('menuitem', { name: 'Edit Ticket' }).click();

        await expect(page.getByLabel('Name')).toBeVisible({ timeout: 10000 });
        console.log('Edit form opened successfully');

        await page.getByLabel('Name').fill(updatedTicketName);
        await page.getByRole('button', { name: 'Update Ticket' }).click();

        // Verify edit
        await searchInput.clear();
        await searchInput.fill(updatedTicketName);

        const updatedTicketRow = page.locator('tr', { hasText: updatedTicketName });
        await expect(updatedTicketRow).toBeVisible({ timeout: 10000 });
        console.log('Ticket edited successfully (updated ticket:', updatedTicketName, ')');

        // ================= DELETE =================
        await updatedTicketRow.getByRole('button', { name: 'Open menu' }).click();
        await page.getByRole('menuitem', { name: 'Delete Ticket' }).click();

        // Confirm delete dialog
        await expect(page.getByText('Are you sure you want to delete this ticket?')).toBeVisible({ timeout: 10000 });
        await page.getByRole('button', { name: 'Confirm & Delete' }).click();

        // Verify deletion
        await searchInput.clear();
        await searchInput.fill(updatedTicketName);
        await expect(page.locator('tr', { hasText: updatedTicketName })).toHaveCount(0, { timeout: 10000 });
        console.log('Ticket deleted successfully (ticket:', updatedTicketName, ')');

    });
});

function timeout(arg0: number) {
    throw new Error('Function not implemented.');
}
