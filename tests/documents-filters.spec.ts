import { test } from '../fixtures/fixtures';

// Tag/Source data verified live via MCP against the QA environment. "Dump File"
// is a low-volume tag (single result page) and "Assets"/"Tickets" are the two
// document sources.
const TAG = {
    filter: 'dump-file' as const,
    label: 'Dump File',
};

test.describe.serial('Documents Page - Tag and Source filters', () => {

    test('MSUP-DOCUMENTS-TC015a_Selecting a Tag filter displays only matching documents', async ({ documentsPage }) => {
        await documentsPage.selectTag(TAG.filter);
        await documentsPage.expectTagChipActive(TAG.filter);
        await documentsPage.expectAllRowsHaveTag(TAG.label);
    });

    test('MSUP-DOCUMENTS-TC015b_Selecting All Tag displays every document', async ({ documentsPage }) => {
        const defaultCount = await documentsPage.getBodyRowCount();
        await documentsPage.selectTag(TAG.filter);
        await documentsPage.expectAllRowsHaveTag(TAG.label);
        await documentsPage.selectTag('all');
        await documentsPage.expectTagChipActive('all');
        await documentsPage.expectRowCount(defaultCount);
    });

    test('MSUP-DOCUMENTS-TC015c_Selecting a Source filter displays matching documents', async ({ documentsPage }) => {
        await documentsPage.selectSource('asset');
        await documentsPage.expectSourceChipActive('asset');
        await documentsPage.expectAllRowsHaveSource('asset');
    });

    test('MSUP-DOCUMENTS-TC015d_Selecting Any Source displays every document', async ({ documentsPage }) => {
        const defaultCount = await documentsPage.getBodyRowCount();
        await documentsPage.selectSource('asset');
        await documentsPage.expectAllRowsHaveSource('asset');
        await documentsPage.selectSource('all');
        await documentsPage.expectSourceChipActive('all');
        await documentsPage.expectRowCount(defaultCount);
    });

    test('MSUP-DOCUMENTS-TC015e_Tag and Source filters work together', async ({ documentsPage }) => {
        await documentsPage.selectTag(TAG.filter);
        await documentsPage.selectSource('ticket');
        await documentsPage.expectTagChipActive(TAG.filter);
        await documentsPage.expectSourceChipActive('ticket');
        await documentsPage.expectAllRowsHaveTag(TAG.label);
        await documentsPage.expectAllRowsHaveSource('ticket');
    });

    test('MSUP-DOCUMENTS-TC015f_Filter counts are displayed correctly', async ({ documentsPage }) => {
        await documentsPage.expectFilterCountsConsistent();
    });

    test('MSUP-DOCUMENTS-TC015g_Changing one filter refreshes the document list', async ({ documentsPage }) => {
        await documentsPage.expectTagChipActive('all');
        await documentsPage.selectTag(TAG.filter);
        // Selecting a specific tag deactivates "All" (only one tag active at a time).
        await documentsPage.expectTagChipActive(TAG.filter);
        await documentsPage.expectAllRowsHaveTag(TAG.label);
    });

    test('MSUP-DOCUMENTS-TC015h_Removing filters restores the original list', async ({ documentsPage }) => {
        const defaultCount = await documentsPage.getBodyRowCount();
        await documentsPage.selectTag(TAG.filter);
        await documentsPage.selectSource('ticket');
        await documentsPage.selectTag('all');
        await documentsPage.selectSource('all');
        await documentsPage.expectTagChipActive('all');
        await documentsPage.expectSourceChipActive('all');
        await documentsPage.expectRowCount(defaultCount);
    });

});
