import { test } from '../fixtures/fixtures';

test.describe.serial('Dashboard - Personalized landing page', () => {

    test('MSUP-DASHBOARD-TC001a_Redirects to Dashboard as default landing page', async ({ dashboardPage }) => {
        await dashboardPage.expectRedirectedToDashboard();
    });

    test('MSUP-DASHBOARD-TC001b_Displays personalized greeting with user name', async ({ dashboardPage }) => {
        await dashboardPage.expectGreetingWithName();
    });

    test('MSUP-DASHBOARD-TC001c_Header shows assigned tickets, connected assets and role', async ({ dashboardPage }) => {
        await dashboardPage.expectFocusSummary();
    });

    test('MSUP-DASHBOARD-TC001d_Displays the logged-in user role', async ({ dashboardPage }) => {
        await dashboardPage.expectUserRoleVisible();
    });

    test('MSUP-DASHBOARD-TC002a_My tickets widget shows header and assignee', async ({ dashboardPage }) => {
        await dashboardPage.expectMyTicketsWidget();
    });

    test('MSUP-DASHBOARD-TC002b_Ticket status summary shows To-Do, Waiting Internal and Waiting External', async ({ dashboardPage }) => {
        await dashboardPage.expectTicketStatusSummary();
    });

    test('MSUP-DASHBOARD-TC002c_My tickets shows Open and Waiting counters', async ({ dashboardPage }) => {
        await dashboardPage.expectOpenAndWaitingCounters();
    });

    test('MSUP-DASHBOARD-TC003a_Assets widget groups assets by operational status', async ({ dashboardPage }) => {
        await dashboardPage.expectAssetsWidget();
    });

    test('MSUP-DASHBOARD-TC003b_Assets widget shows percentage distribution', async ({ dashboardPage }) => {
        await dashboardPage.expectAssetPercentageDistribution();
    });

    test('MSUP-DASHBOARD-TC004a_Assets need maintenance widget is displayed', async ({ dashboardPage }) => {
        await dashboardPage.expectAssetsNeedMaintenanceWidget();
    });

    test('MSUP-DASHBOARD-TC004b_Assets with errors widget is displayed', async ({ dashboardPage }) => {
        await dashboardPage.expectAssetsWithErrorsWidget();
    });

    test('MSUP-DASHBOARD-TC005a_Tickets need attention widget is displayed', async ({ dashboardPage }) => {
        await dashboardPage.expectTicketsNeedAttentionWidget();
    });

    test('MSUP-DASHBOARD-TC005b_Attention ticket card shows ID, status, org, asset and timestamp', async ({ dashboardPage }) => {
        await dashboardPage.expectTicketCardFields('attention');
    });

    test('MSUP-DASHBOARD-TC005c_Attention tickets are ordered most neglected first', async ({ dashboardPage }) => {
        await dashboardPage.expectTicketsNeedAttentionOrderedOldestFirst();
    });

    test('MSUP-DASHBOARD-TC006a_New tickets widget is displayed', async ({ dashboardPage }) => {
        await dashboardPage.expectNewTicketsWidget();
    });

    test('MSUP-DASHBOARD-TC006b_New ticket card shows ID, status, org, asset and timestamp', async ({ dashboardPage }) => {
        await dashboardPage.expectTicketCardFields('new');
    });

    test('MSUP-DASHBOARD-TC006c_New tickets are ordered freshest first', async ({ dashboardPage }) => {
        await dashboardPage.expectNewTicketsOrderedFreshestFirst();
    });

    test('MSUP-DASHBOARD-TC007a_Notifications widget is displayed', async ({ dashboardPage }) => {
        await dashboardPage.expectNotificationsWidget();
    });

    test('MSUP-DASHBOARD-TC007b_Notification shows message and timestamp', async ({ dashboardPage }) => {
        await dashboardPage.expectNotificationFields();
    });

    test('MSUP-DASHBOARD-TC007c_Notifications are ordered newest first', async ({ dashboardPage }) => {
        await dashboardPage.expectNotificationsOrderedNewestFirst();
    });
});
