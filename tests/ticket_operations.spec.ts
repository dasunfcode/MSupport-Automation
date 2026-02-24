import { test, expect, Page, Locator } from '@playwright/test';

async function openMenuAndClick(row: Locator, page: Page, menuItemName: string) {

  const menuButton = row.getByRole('button', { name: 'Open menu' }).first();

  console.log(`Clicking Open menu for "${menuItemName}"`);
  await expect(menuButton).toBeVisible({ timeout: 10000 });
  await menuButton.click();

  const dropdown = page.locator('[role="menu"]').first();
  await expect(dropdown).toBeVisible({ timeout: 10000 });

  const menuItem = dropdown.getByRole('menuitem', { name: menuItemName });
  await expect(menuItem).toBeVisible({ timeout: 10000 });

  await menuItem.click();
}

// Generate unique ticket name for each test run
function generateTicketName() {
  return `Test Ticket ${Date.now()}`;
}

test.describe.serial('Ticket CRUD flow', () => {
  let ticketName: string;
  let updatedTicketName: string;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(`${process.env.BASE_URL}/dashboard/tickets`);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('MSUP-TICKET-TC007_Add Ticket', async () => {
    ticketName = generateTicketName();

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
  });

  test('MSUP-TICKET-TC008_Search Ticket', async () => {
    const searchInput = page.getByPlaceholder('Search by Ticket ID, Name, Type...');
    await searchInput.fill(ticketName);

    const ticketRow = page.locator('tr', { hasText: ticketName });
    await expect(ticketRow).toBeVisible();

    console.log('Ticket search successful');
  });

  test('MSUP-TICKET-TC009_View Ticket', async () => {
    const searchInput = page.getByPlaceholder('Search by Ticket ID, Name, Type...');
    await searchInput.fill(ticketName);

    const ticketRow = page.locator('tr', { hasText: ticketName });
    await expect(ticketRow).toBeVisible();
    console.log('Ticket viewed');
  });

  test('MSUP-TICKET-TC010_Edit Ticket', async () => {
    updatedTicketName = `${ticketName} Updated`;
    const searchInput = page.getByPlaceholder('Search by Ticket ID, Name, Type...');
    await searchInput.fill(ticketName);

    const ticketRow = page.locator('tr', { hasText: ticketName });
    await openMenuAndClick(ticketRow, page, 'Edit Ticket');

    await page.getByLabel('Name').fill(updatedTicketName);
    await page.getByRole('button', { name: 'Update Ticket' }).click();

    await searchInput.fill(updatedTicketName);
    const updatedRow = page.locator('tr', { hasText: updatedTicketName });
    await expect(updatedRow).toBeVisible();
    console.log('Ticket edited');
  });

  test('MSUP-TICKET-TC011_Delete Ticket', async () => {
    const searchInput = page.getByPlaceholder('Search by Ticket ID, Name, Type...');
    await searchInput.fill(updatedTicketName);

    const ticketRow = page.locator('tr', { hasText: updatedTicketName });
    await openMenuAndClick(ticketRow, page, 'Delete Ticket');

    await page.getByRole('button', { name: 'Confirm & Delete' }).click();
    await searchInput.fill(updatedTicketName);

    await expect(page.locator('tr', { hasText: updatedTicketName })).toHaveCount(0);
    console.log('Ticket deleted');
  });
});