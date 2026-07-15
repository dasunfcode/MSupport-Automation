import { test } from '../fixtures/fixtures';

// The document detail story is validated against the first (top) row, which the
// app sorts by Updated descending on load.
const ROW = 0;

test.describe.serial('Documents Page - View document information', () => {

    test('MSUP-DOCUMENTS-TC016a_Document row displays all metadata fields', async ({ documentsPage }) => {
        await documentsPage.expectRowFieldsPopulated(ROW);
    });

    test('MSUP-DOCUMENTS-TC016b_Clicking a sortable column header sorts the data', async ({ documentsPage }) => {
        await documentsPage.expectColumnSortsAscending('Document', 0);
    });

    test('MSUP-DOCUMENTS-TC016c_Long Organization names are truncated and stay aligned', async ({ documentsPage }) => {
        await documentsPage.expectOrganizationColumnTruncates();
    });

    test('MSUP-DOCUMENTS-TC016d_Clicking a row opens the document side panel', async ({ documentsPage }) => {
        await documentsPage.openRowPanel(ROW);
        await documentsPage.expectPanelHasCloseButton();
    });

    test('MSUP-DOCUMENTS-TC016e_Side panel shows the document name', async ({ documentsPage }) => {
        const row = await documentsPage.openRowPanel(ROW);
        await documentsPage.expectPanelTitle(row.name);
    });

    test('MSUP-DOCUMENTS-TC016f_Side panel shows the Source and Tag', async ({ documentsPage }) => {
        const row = await documentsPage.openRowPanel(ROW);
        await documentsPage.expectPanelDetail('Tag', row.tag);
        await documentsPage.expectPanelDetail('Source', row.source);
    });

    test('MSUP-DOCUMENTS-TC016g_Side panel shows a document preview', async ({ documentsPage }) => {
        await documentsPage.openRowPanel(ROW);
        await documentsPage.expectPanelPreviewVisible();
    });

    test('MSUP-DOCUMENTS-TC016h_Side panel displays all metadata labels', async ({ documentsPage }) => {
        await documentsPage.openRowPanel(ROW);
        await documentsPage.expectPanelHasAllDetailLabels();
    });

    test('MSUP-DOCUMENTS-TC016i_Side panel metadata matches the selected row', async ({ documentsPage }) => {
        const row = await documentsPage.openRowPanel(ROW);
        await documentsPage.expectPanelMatchesRow(row);
    });

    test('MSUP-DOCUMENTS-TC016j_Side panel has Download and Close buttons', async ({ documentsPage }) => {
        await documentsPage.openRowPanel(ROW);
        await documentsPage.expectPanelHasDownloadButton();
        await documentsPage.expectPanelHasCloseButton();
    });

    test('MSUP-DOCUMENTS-TC016k_Close button closes the side panel', async ({ documentsPage }) => {
        await documentsPage.openRowPanel(ROW);
        await documentsPage.closePanel();
        await documentsPage.expectPanelClosed();
    });

});
