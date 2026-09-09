import { test, expect } from '../fixtures/fixtures';

test.describe.serial('Support Hub - Centralized documentation access', () => {

    test('MSUP-SUPPORTHUB-TC001a_Open Support Hub page from left navigation', async ({ supportHubPage }) => {
        await supportHubPage.gotoDashboard();
        await supportHubPage.openFromLeftNav();
        await supportHubPage.expectHeadingVisible();
    });

    test('MSUP-SUPPORTHUB-TC001b_Display page title', async ({ supportHubPage }) => {
        await supportHubPage.expectPageTitleVisible();
    });

    test('MSUP-SUPPORTHUB-TC001c_Display heading and sub heading', async ({ supportHubPage }) => {
        await supportHubPage.expectHeadingVisible();
    });

    test('MSUP-SUPPORTHUB-TC001d_Display search textbox', async ({ supportHubPage }) => {
        await supportHubPage.expectSearchVisible();
    });

    test('MSUP-SUPPORTHUB-TC001e_Search textbox accepts input', async ({ supportHubPage }) => {
        await supportHubPage.expectSearchAcceptsInput('diagnostics dump');
    });

    test('MSUP-SUPPORTHUB-TC001f_Display Category filters', async ({ supportHubPage }) => {
        await supportHubPage.expectCategoryFiltersVisible();
    });

    test('MSUP-SUPPORTHUB-TC001g_Display Product filters', async ({ supportHubPage }) => {
        await supportHubPage.expectProductFiltersVisible();
    });

    test('MSUP-SUPPORTHUB-TC001h_Display Type filters', async ({ supportHubPage }) => {
        await supportHubPage.expectTypeFiltersVisible();
    });

    test('MSUP-SUPPORTHUB-TC001i_Display Language filters', async ({ supportHubPage }) => {
        await supportHubPage.expectLangFiltersVisible();
    });

    test('MSUP-SUPPORTHUB-TC001j_Display notification and user info on top nav', async ({ supportHubPage }) => {
        await supportHubPage.expectTopNavVisible();
    });

    test('MSUP-SUPPORTHUB-TC001k_Document card displays all required fields', async ({ supportHubPage }) => {
        await supportHubPage.expectCardFieldsPopulated(0);
    });

    test('MSUP-SUPPORTHUB-TC001l_Filter by Category shows only matching cards', async ({ supportHubPage }) => {
        await supportHubPage.selectCategory('maintenance');
        await supportHubPage.expectAllCardsHaveCategory('Maintenance');
    });

    test('MSUP-SUPPORTHUB-TC001m_Filter by Product shows only matching cards', async ({ supportHubPage }) => {
        await supportHubPage.selectCategory('all');
        await supportHubPage.selectProduct('mprint');
        await supportHubPage.expectAllCardsHaveProduct('MPRINT');
    });

    test('MSUP-SUPPORTHUB-TC001n_Combining filters with no matches shows empty state', async ({ supportHubPage }) => {
        await supportHubPage.selectProduct('all');
        await supportHubPage.selectCategory('installation');
        await supportHubPage.selectProduct('mpure');
        await supportHubPage.expectEmptyState();
    });

    test('MSUP-SUPPORTHUB-TC001o_Clicking a card opens document preview', async ({ supportHubPage }) => {
        await supportHubPage.selectProduct('all');
        await supportHubPage.selectCategory('all');
        await supportHubPage.openCard(0);
        await supportHubPage.expectPreviewDialogVisible();
        await supportHubPage.closePreviewDialog();
    });

    test('MSUP-SUPPORTHUB-TC003a_Preview modal displays title, updated date, description field and close icon', async ({ supportHubPage }) => {
        await supportHubPage.openCard(0);
        await supportHubPage.expectPreviewHeaderDetailsVisible();
    });

    test('MSUP-SUPPORTHUB-TC003b_Preview modal displays the document preview pane with page navigation', async ({ supportHubPage }) => {
        await supportHubPage.openCard(0);
        await supportHubPage.expectPreviewPdfPaneVisible();
        expect(await supportHubPage.getPreviewPdfPage()).toBe(1);
        await supportHubPage.expectPreviewPdfPrevButtonDisabled();
    });

    test('MSUP-SUPPORTHUB-TC003c_PDF navigation buttons move between pages', async ({ supportHubPage }) => {
        await supportHubPage.openCard(0);
        await supportHubPage.goToNextPreviewPdfPage();
        expect(await supportHubPage.getPreviewPdfPage()).toBe(2);
        await expect(supportHubPage.previewPdfPrevButton).toBeEnabled();
    });

    test('MSUP-SUPPORTHUB-TC003d_Preview modal displays FAQ and Keyword sync status', async ({ supportHubPage }) => {
        await supportHubPage.openCard(0);
        await supportHubPage.expectPreviewSyncStatusVisible();
    });

    test('MSUP-SUPPORTHUB-TC003e_Download PDF button downloads the document', async ({ supportHubPage }) => {
        await supportHubPage.openCard(0);
        const download = await supportHubPage.downloadPreviewPdf();
        expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    });

    test('MSUP-SUPPORTHUB-TC003f_Closing the preview via the close icon returns to the Support Hub landing page', async ({ supportHubPage }) => {
        await supportHubPage.openCard(0);
        await supportHubPage.closePreviewDialogAndExpectLandingPage();
    });

    test('MSUP-SUPPORTHUB-TC002a_Search returns ranked results with a Best Answer', async ({ supportHubPage }) => {
        await supportHubPage.search('Oxygen sensor replacement');
        await supportHubPage.expectResultsHeadingVisible();
        expect(await supportHubPage.getResultsCount()).toBeGreaterThan(0);
        await supportHubPage.expectBestAnswerCardVisible();
    });

    test('MSUP-SUPPORTHUB-TC002b_Best Answer card displays source, language, product and type tags', async ({ supportHubPage }) => {
        await supportHubPage.search('Oxygen sensor replacement');
        await supportHubPage.expectBestAnswerHasTags(['FAQ', 'EN', 'Manual', 'MPRINT']);
    });

    test('MSUP-SUPPORTHUB-TC002c_Best Answer Open PDF opens the document at the referenced page', async ({ supportHubPage }) => {
        await supportHubPage.search('Oxygen sensor replacement');
        const popup = await supportHubPage.openResultPdf(supportHubPage.bestAnswerCard);
        await popup.close();
    });

    test('MSUP-SUPPORTHUB-TC002d_More Results section lists additional matches with required fields', async ({ supportHubPage }) => {
        await supportHubPage.search('Oxygen sensor replacement');
        await supportHubPage.expectMoreResultsVisible();
        await supportHubPage.expectMoreResultsItemPopulated(0);
    });

    test('MSUP-SUPPORTHUB-TC002e_More Results Open PDF opens the document at that result\'s page', async ({ supportHubPage }) => {
        await supportHubPage.search('Oxygen sensor replacement');
        const popup = await supportHubPage.openResultPdf(supportHubPage.moreResultsItems.nth(0));
        await popup.close();
    });

    test('MSUP-SUPPORTHUB-TC002f_Search is case-insensitive', async ({ supportHubPage }) => {
        await supportHubPage.search('Oxygen sensor replacement');
        const lowerCount = await supportHubPage.getResultsCount();

        await supportHubPage.search('OXYGEN SENSOR REPLACEMENT');
        const upperCount = await supportHubPage.getResultsCount();

        expect(upperCount).toBe(lowerCount);
        await supportHubPage.expectBestAnswerCardVisible();
    });

    test('MSUP-SUPPORTHUB-TC002g_No matching results shows the No Close Matches state', async ({ supportHubPage }) => {
        const term = 'zzznonexistentqueryxyz123';
        await supportHubPage.search(term);
        await supportHubPage.expectNoMatchesState(term);
    });

    test('MSUP-SUPPORTHUB-TC002h_Clearing the search restores the default card listing', async ({ supportHubPage }) => {
        await supportHubPage.search('Oxygen sensor replacement');
        await supportHubPage.expectBestAnswerCardVisible();

        await supportHubPage.clearSearchAndRestoreDefault();
        await expect(supportHubPage.bestAnswerLabel).toBeHidden();
        expect(await supportHubPage.getCardCount()).toBeGreaterThan(0);
    });

    test('MSUP-SUPPORTHUB-TC002i_Category/Product/Type/Language filters combine with an active search', async ({ supportHubPage }) => {
        await supportHubPage.search('Oxygen sensor replacement');
        const unfilteredCount = await supportHubPage.getResultsCount();

        await supportHubPage.selectProduct('mpurepro');
        const filteredCount = await supportHubPage.getResultsCount();

        expect(filteredCount).toBeLessThan(unfilteredCount);
        await supportHubPage.selectProduct('all');
    });

});
