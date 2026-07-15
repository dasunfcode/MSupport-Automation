import { test } from '../fixtures/fixtures';

test.describe.serial('Documents Page - View uploaded documents', () => {

    test('MSUP-DOCUMENTS-TC013a_Open Documents page from left navigation', async ({ documentsPage }) => {
        await documentsPage.gotoDashboard();
        await documentsPage.openFromLeftNav();
        await documentsPage.expectPageTitleVisible();
    });

    test('MSUP-DOCUMENTS-TC013b_Display page title', async ({ documentsPage }) => {
        await documentsPage.expectPageTitleVisible();
    });

    test('MSUP-DOCUMENTS-TC013c_Display search textbox', async ({ documentsPage }) => {
        await documentsPage.expectSearchVisible();
    });

    test('MSUP-DOCUMENTS-TC013d_Display Tag filters', async ({ documentsPage }) => {
        await documentsPage.expectTagFiltersVisible();
    });

    test('MSUP-DOCUMENTS-TC013e_Display Source filters', async ({ documentsPage }) => {
        await documentsPage.expectSourceFiltersVisible();
    });

    test('MSUP-DOCUMENTS-TC013f_Display document table columns', async ({ documentsPage }) => {
        await documentsPage.expectTableColumns();
    });

    test('MSUP-DOCUMENTS-TC013g_Display pagination controls', async ({ documentsPage }) => {
        await documentsPage.expectPaginationVisible();
    });

    test('MSUP-DOCUMENTS-TC013h_Change rows per page', async ({ documentsPage }) => {
        await documentsPage.changeRowsPerPage('20');
    });

    test('MSUP-DOCUMENTS-TC013i_Sortable column headers show sort control', async ({ documentsPage }) => {
        await documentsPage.expectSortableColumnsHaveSortControl();
    });

    test('MSUP-DOCUMENTS-TC013j_Display notification and user info on top nav', async ({ documentsPage }) => {
        await documentsPage.expectTopNavVisible();
    });

    test('MSUP-DOCUMENTS-TC013k_Documents sorted by Updated descending', async ({ documentsPage }) => {
        await documentsPage.expectDocumentsSortedByUpdatedDescending();
    });

    test('MSUP-DOCUMENTS-TC013l_Show empty state when no documents match', async ({ documentsPage }) => {
        await documentsPage.searchFor('zzzznonexistentdoc9999');
        await documentsPage.expectEmptyState();
    });

});
