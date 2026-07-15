import { test } from '../fixtures/fixtures';

// The download story is validated against the top rows, which the app sorts by
// Updated descending on load.
const ROW = 0;
const OTHER_ROW = 1;

test.describe.serial('Documents Page - Download document', () => {

    test('MSUP-DOCUMENTS-TC017a_Every document row displays a Download action', async ({ documentsPage }) => {
        await documentsPage.expectEveryRowHasDownloadButton();
    });

    test('MSUP-DOCUMENTS-TC017b_Clicking Download downloads the selected document with original filename', async ({ documentsPage }) => {
        await documentsPage.expectRowDownloadsOriginalFile(ROW);
    });

    test('MSUP-DOCUMENTS-TC017c_Downloaded file preserves filename, extension and non-empty content', async ({ documentsPage }) => {
        await documentsPage.expectRowDownloadsOriginalFile(OTHER_ROW);
    });

    test('MSUP-DOCUMENTS-TC017d_Downloading from the side panel downloads the same document', async ({ documentsPage }) => {
        const row = await documentsPage.openRowPanel(ROW);
        await documentsPage.expectPanelDownloadsOriginalFile(row);
    });

    test('MSUP-DOCUMENTS-TC017e_Downloading one document does not affect other documents', async ({ documentsPage }) => {
        await documentsPage.expectDownloadsAreIndependent(ROW, OTHER_ROW);
    });

    test('MSUP-DOCUMENTS-TC017f_Show an error when the file is unavailable', async ({ documentsPage }) => {
        await documentsPage.expectDownloadErrorWhenFileUnavailable(ROW);
    });

});
