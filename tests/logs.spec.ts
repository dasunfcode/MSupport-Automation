import { test } from '@playwright/test';
import { LogsPage } from '../pages/LogsPage';

test.describe.serial('Logs Page Tests', () => {

  test('MSUP-LOGS-TC012_Should_display_all_log_tabs', async ({ page }) => {
    const logsPage = new LogsPage(page);

    await logsPage.goto();
    await logsPage.expectAllTabsVisible();
  });

});