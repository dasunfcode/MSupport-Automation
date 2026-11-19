import { test } from '../fixtures/fixtures';

const NARROW_VIEWPORT = { width: 390, height: 844 };

test.describe.serial('Dashboard - Setup not finalized', () => {

    // ---- The section -------------------------------------------------------

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC001a_Section is displayed with title and subtitle', async ({ dashboardPage }) => {
        await dashboardPage.expectSetupNotFinalizedSection();
    });

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC001b_Count badge shows the number of incomplete machines', async ({ dashboardPage }) => {
        await dashboardPage.expectSetupCountBadge();
    });

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC001c_Count badge matches the listed machines in scope', async ({ dashboardPage }) => {
        await dashboardPage.expectSetupCountMatchesRows();
    });

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC001d_Empty state shows 0 when no machine is incomplete', async ({ dashboardPage }) => {
        test.skip((await dashboardPage.setupRowCount()) > 0, 'The user currently has incomplete machines');
        await dashboardPage.expectSetupEmptyState();
    });

    // ---- The list ----------------------------------------------------------

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC002a_Every listed machine has at least one missing item', async ({ dashboardPage }) => {
        await dashboardPage.expectEveryRowHasAMissingItem();
    });

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC002b_Rows are sorted longest incomplete first', async ({ dashboardPage }) => {
        await dashboardPage.expectSetupRowsSortedLongestIncompleteFirst();
    });

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC002c_Section keeps a fixed height and the list scrolls inside it', async ({ dashboardPage }) => {
        await dashboardPage.expectSetupSectionFixedHeightAndScrollable();
    });

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC002d_View in the asset table link is always displayed', async ({ dashboardPage }) => {
        await dashboardPage.expectAssetTableLinkVisible();
    });

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC002e_View in the asset table opens Asset Management', async ({ dashboardPage }) => {
        await dashboardPage.openAssetTableFromSetupSection();
    });

    // ---- A row -------------------------------------------------------------

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC003a_Row shows bold serial, machine type, end customer and age', async ({ dashboardPage }) => {
        test.skip((await dashboardPage.setupRowCount()) === 0, 'No incomplete machines');
        await dashboardPage.expectSetupRowFields();
    });

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC003b_Row shows one correctly labelled chip per missing item', async ({ dashboardPage }) => {
        test.skip((await dashboardPage.setupRowCount()) === 0, 'No incomplete machines');
        await dashboardPage.expectSetupChipLabels();
    });

    // ---- Navigation --------------------------------------------------------

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC004a_Installation date chip opens the asset General Info for editing', async ({ dashboardPage }) => {
        const row = await dashboardPage.setupRowWithChip('installation-date');
        test.skip(!row, 'No machine is missing an installation date');
        await dashboardPage.openInstallationDateChipAndExpectGeneralInfo(row!);
    });

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC004b_Installation report chip opens the asset on the Documents tab', async ({ dashboardPage }) => {
        const row = await dashboardPage.setupRowWithChip('installation-report');
        test.skip(!row, 'No machine is missing an installation report');
        await dashboardPage.openSetupRowAndExpectDocumentsTab(row!, 'installation-report');
    });

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC004c_Serial number link opens the asset on the Documents tab', async ({ dashboardPage }) => {
        test.skip((await dashboardPage.setupRowCount()) === 0, 'No incomplete machines');
        await dashboardPage.openSetupRowAndExpectDocumentsTab(dashboardPage.setupRows.first(), 'serial');
    });

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC004d_Clicking elsewhere on the row opens the asset on the Documents tab', async ({ dashboardPage }) => {
        test.skip((await dashboardPage.setupRowCount()) === 0, 'No incomplete machines');
        await dashboardPage.openSetupRowAndExpectDocumentsTab(dashboardPage.setupRows.first(), 'row');
    });

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC004e_Nothing is editable on the Dashboard section', async ({ dashboardPage }) => {
        await dashboardPage.expectSetupSectionHasNoEditableFields();
    });

    // ---- Responsive --------------------------------------------------------

    test('MSUP-DASHBOARD-SETUP-NOT-FINALIZED-TC005a_Chips wrap onto a second line on narrow screens', async ({ dashboardPage, page }) => {
        await page.setViewportSize(NARROW_VIEWPORT);
        await dashboardPage.goto();
        test.skip(!(await dashboardPage.hasSetupRowWithBothChips()), 'No row with more than one chip');
        await dashboardPage.expectSetupChipsWrapOnNarrowScreen();
    });
});
