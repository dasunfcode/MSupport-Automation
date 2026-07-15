import { test } from '../fixtures/fixtures';

// Stable data present in the QA environment's Documents list, verified live via MCP.
const DOC_FULL_NAME = 'MPR00059-diagnostics-20240221-133607 (2).dump';
const SEARCH = {
    documentNamePartial: 'diagnost',        // -> DOC_FULL_NAME (partial of "diagnostics")
    documentNameUpper: 'DIAGNOSTICS',       // case-insensitivity check
    assetId: 'MPR43242',                    // Source column: "Asset #MPR43242"
    ticketNumber: '10999',                  // Source column: "Ticket #10999"
    organization: 'Escalate basic new BB',  // Organization column
    noMatch: `zzzznope-${Date.now()}`,      // guaranteed no results
};

test.describe.serial('Documents Page - Search', () => {

    test('MSUP-DOCUMENTS-TC014a_Search textbox accepts input', async ({ documentsPage }) => {
        await documentsPage.expectSearchAcceptsInput(SEARCH.documentNamePartial);
    });

    test('MSUP-DOCUMENTS-TC014b_Search by document name returns matching documents', async ({ documentsPage }) => {
        await documentsPage.searchFor(SEARCH.documentNamePartial);
        await documentsPage.expectResultsDocumentColumnAllContain(SEARCH.documentNamePartial);
    });

    test('MSUP-DOCUMENTS-TC014c_Search by asset returns matching documents', async ({ documentsPage }) => {
        await documentsPage.searchFor(SEARCH.assetId);
        await documentsPage.expectResultsSourceColumnAllContain(SEARCH.assetId);
    });

    test('MSUP-DOCUMENTS-TC014d_Search by ticket returns matching documents', async ({ documentsPage }) => {
        await documentsPage.searchFor(SEARCH.ticketNumber);
        await documentsPage.expectResultsSourceColumnAllContain(SEARCH.ticketNumber);
    });

    test('MSUP-DOCUMENTS-TC014e_Search by organization returns matching documents', async ({ documentsPage }) => {
        await documentsPage.searchFor(SEARCH.organization);
        await documentsPage.expectResultsOrganizationColumnAllContain(SEARCH.organization);
    });

    test('MSUP-DOCUMENTS-TC014f_Search results update immediately without submitting', async ({ documentsPage }) => {
        await documentsPage.searchFor(SEARCH.documentNamePartial);
        await documentsPage.expectDocumentVisible(DOC_FULL_NAME);
    });

    test('MSUP-DOCUMENTS-TC014g_Partial keyword matches are supported', async ({ documentsPage }) => {
        await documentsPage.searchFor(SEARCH.documentNamePartial);
        await documentsPage.expectResultsDocumentColumnAllContain(SEARCH.documentNamePartial);
    });

    test('MSUP-DOCUMENTS-TC014h_Search is case insensitive', async ({ documentsPage }) => {
        await documentsPage.searchFor(SEARCH.documentNameUpper);
        await documentsPage.expectResultsDocumentColumnAllContain('diagnostics');
    });

    test('MSUP-DOCUMENTS-TC014i_Empty state shown when no documents match', async ({ documentsPage }) => {
        await documentsPage.searchFor(SEARCH.noMatch);
        await documentsPage.expectEmptyState();
    });

    test('MSUP-DOCUMENTS-TC014j_Clearing search restores complete document list', async ({ documentsPage }) => {
        const initial = await documentsPage.getBodyRowCount();
        await documentsPage.searchFor(SEARCH.documentNamePartial);
        await documentsPage.expectResultsDocumentColumnAllContain(SEARCH.documentNamePartial);
        await documentsPage.clearSearch();
        await documentsPage.expectRowCount(initial);
    });

});
