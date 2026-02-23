import { test, expect } from '@playwright/test';

test.describe.serial('Logs Page Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${process.env.BASE_URL}/dashboard/logs`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('table tbody tr');
    console.log('Navigated to Logs page');
  });

  test('MSUP-LOGS-TC012_Should_display_all_log_tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Organizations' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'users' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Assets' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'tickets' })).toBeVisible();
    console.log('All log tabs are visible');
  });
});