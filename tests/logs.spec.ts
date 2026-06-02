import { test } from '../fixtures/fixtures';

test.describe.serial('Logs Page Tests', () => {

  test('MSUP-LOGS-TC012_Should_display_all_log_tabs', async ({ logsPage }) => {
    await logsPage.expectAllTabsVisible();
  });

});