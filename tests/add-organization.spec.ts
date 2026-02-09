import { test, expect } from '@playwright/test';

test('TC002_Add new organization via modal', async ({ page }) => {
  // You are already logged in via storageState
  await page.goto('https://qa.msupport.mone.am/dashboard/organizations');

  // 1. Click "Add new organization" button using XPath
  const addOrgButton = page.locator(
    'xpath=/html/body/div[2]/main/div[1]/div/div[2]/div/button'
  );

  await expect(addOrgButton).toBeVisible();
  await addOrgButton.click();

  // 2. Verify modal is visible
  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();

//   // 4. Fill modal fields
//   await modal.getByLabel(/organization name/i).fill('Test Organization');
//   await modal.getByLabel(/description/i).fill('Test organization created by automation');

//   // 5. Click Save / Create
//   await modal.getByRole('button', { name: /save|create/i }).click();

//   // 6. Verify success toast or message
//   await expect(
//     page.getByText(/organization created successfully/i)
//   ).toBeVisible();

//   // 7. Optional: verify org appears in list
//   await expect(
//     page.getByText('Test Organization')
//   ).toBeVisible();
});