import { test, expect, Page, Locator } from '@playwright/test';

test.describe.serial('Ticket CRUD flow', () => {

    test('TC003_CRUD_Add_View_Edit_Delete Ticket', async ({ page }) => {

        const ticketName = `Test Ticket ${Date.now()}`;
        const updatedTicketName = `${ticketName} Updated`;

        // ================= ADD =================
        await page.goto(`${process.env.BASE_URL}/dashboard/tickets`);

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

        console.log('Ticket added');

        // ================= VIEW =================
        await page.goto(`${process.env.BASE_URL}/dashboard/tickets`);
        const searchInput = page.getByPlaceholder('Search by Ticket ID, Name, Type...');
        await searchInput.fill(ticketName);

        const ticketRow = page.locator('tr', { hasText: ticketName });
        await expect(ticketRow).toBeVisible();

        console.log('Ticket viewed');

        // ================= EDIT =================
        await openMenuAndClick(ticketRow, page, 'Edit Ticket');

        await page.getByLabel('Name').fill(updatedTicketName);
        await page.getByRole('button', { name: 'Update Ticket' }).click();

        await searchInput.clear();
        await searchInput.fill(updatedTicketName);

        const updatedRow = page.locator('tr', { hasText: updatedTicketName });
        await expect(updatedRow).toBeVisible();

        console.log('Ticket edited');

        // ================= DELETE =================
        await openMenuAndClick(updatedRow, page, 'Delete Ticket');

        await page.getByRole('button', { name: 'Confirm & Delete' }).click();

        await searchInput.clear();
        await searchInput.fill(updatedTicketName);

        await expect(page.locator('tr', { hasText: updatedTicketName })).toHaveCount(0);

        console.log('Ticket deleted');
    });
});

/**
 * Opens the correct menu button in the row and clicks the specified menu item.
 * Handles Edit/Delete menu buttons, Radix animations, and scrolling.
 */
async function openMenuAndClick(
    row: Locator,
    page: Page,
    menuItemName: string
): Promise<void> {

    const menuButtons = row.getByRole('button', { name: 'Open menu' });
    let buttonToClick: Locator;

    if (menuItemName.includes('Edit')) {
        buttonToClick = menuButtons.first(); // first menu button is Edit
    } else {
        buttonToClick = menuButtons.last();  // last menu button is Delete
    }

    await expect(buttonToClick).toBeVisible();
    await buttonToClick.click();

    const dropdown = page.locator('[role="menu"]').first();
    await expect(dropdown).toBeVisible({ timeout: 5000 });

    const menuItem = dropdown.getByRole('menuitem', { name: menuItemName });
    await expect(menuItem).toBeVisible({ timeout: 10000 });

    await menuItem.scrollIntoViewIfNeeded();
    await menuItem.click({ force: true });
}