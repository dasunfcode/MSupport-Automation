import { test, expect } from '@playwright/test';

test.describe.serial('Organization CRUD flow', () => {
  const timestamp = Date.now();
  let orgName = `Test Organization ${timestamp}`;
  let updatedOrgName = `${orgName} Updated`;
  const email = `test+${timestamp}@gmail.com`;
  const phone = Math.floor(1000000000 + Math.random() * 9000000000).toString();

  test('Add Organization', async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/dashboard/organizations`);

    await page.getByRole('button', { name: 'Add New Organization' }).click();
    await page.getByRole('dialog').waitFor();

    await page.getByText('Extended Service Partner Organization').click();
    await page.getByText('Next').click();

    await page.getByLabel('Company Name').fill(orgName);
    await page.getByLabel('Phone Number').fill(phone);
    await page.getByLabel('Email Address').fill(email);

    await page.getByText('Next').click();
    await page.getByText('Next').click();
    await page.getByText('Add Organization').click();

    console.log('Organization added:', orgName);
  });

  test('View Organization', async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/dashboard/organizations`);

    const row = page.locator('tr', { hasText: orgName });
    await expect(row).toBeVisible();

    await row.getByRole('button', { name: 'Open menu' }).click();
    await page.getByText('View').click();

    await expect(page.getByText(orgName)).toBeVisible();
    console.log('Organization viewed successfully');
  });

  test('Edit Organization', async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/dashboard/organizations`);

    const editRow = page.locator('tr', { hasText: orgName });
    await expect(editRow).toBeVisible();

    await editRow.getByRole('button', { name: 'Open menu' }).click();
    await page.getByText('Edit').click();

    await page.getByLabel('Company Name').fill(updatedOrgName);
    await page.getByText('Update Organization').click();

    await expect(page.getByText(updatedOrgName)).toBeVisible();
    console.log('Organization edited successfully');
  });

  test('Delete Organization', async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/dashboard/organizations`);

    const deleteRow = page.locator('tr', { hasText: updatedOrgName });
    await expect(deleteRow).toBeVisible();

    await deleteRow.getByRole('button', { name: 'Open menu' }).click();
    await page.getByText('Deactivate Organization').click();

    await page.getByText('Confirm & Deactivate').click();

    // Optionally verify it is gone
    // await expect(page.locator('tr', { hasText: updatedOrgName })).toHaveCount(0);

    console.log('Organization deleted successfully');
  });
});