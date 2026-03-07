import { test } from '@playwright/test';
import { AssetsPage } from '../pages/AssetsPage';
import { AssetCreateDialog } from '../pages/AssetCreateDialog';
import { AssetMCareDialog } from '../pages/AssetMCareDialog';

// ==================== EASY-TO-CHANGE TEST DATA ====================
const ASSET_NAME = `Test Asset ${Date.now()}`;
const LOCATION = 'Colombo';
const UPDATED_LOCATION = 'Berlin';
const RELATED_CONTACT = 'Lakindu';
const ORGANIZATION = 'Fcode labs';
const DESTINATION_COUNTRY = 'Sri Lanka';
const NOTES = 'Test asset created via automation';
const MCARE_PACKAGE = 'MCare +1 year - 1 Month';
// ================================================================

test.describe.serial('Asset CRUD flow - NO LOGIN', () => {
    let assetsPage: AssetsPage;
    let createDialog: AssetCreateDialog;
    let mcareDialog: AssetMCareDialog;

    // ← THIS IS THE MAGIC LINE (no login ever again)
    test.use({ storageState: './storage/auth.json' });

    test.beforeEach(async ({ page }) => {
        assetsPage = new AssetsPage(page);
        createDialog = new AssetCreateDialog(page);
        mcareDialog = new AssetMCareDialog(page);
    });

    test('TC004_CRUD_Add_View_Edit_Delete_Asset_and_MCare', async () => {
        // ================= CREATE NEW ASSET =================
        await assetsPage.navigateTo();
        await assetsPage.clickAddNewAsset();

        await createDialog.fillBasicInformation(ASSET_NAME);
        await createDialog.fillLocationAndDates(LOCATION, RELATED_CONTACT, ORGANIZATION);
        await createDialog.fillEndCustomerAndNotes(DESTINATION_COUNTRY, NOTES);
        await createDialog.submit();

        // ================= VIEW ASSET =================
        await assetsPage.navigateTo();
        await assetsPage.viewFirstAsset();

        // ================= MANAGE MCARE PACKAGES =================
        await assetsPage.navigateTo();
        await assetsPage.openManageMCareForFirstAsset();
        await mcareDialog.addBookedMCare(MCARE_PACKAGE);
        await mcareDialog.addYearlyMaintenance();
        await mcareDialog.update();

        // ================= EDIT ASSET =================
        await assetsPage.navigateTo();
        await assetsPage.editFirstAsset(UPDATED_LOCATION);

        // ================= DELETE ASSET =================
        await assetsPage.navigateTo();
        await assetsPage.deleteFirstAsset();

        // ================= FILTER & EXPORT =================
        await assetsPage.navigateTo();
        await assetsPage.applyAssetTypeFilter();
        await assetsPage.exportAssets();

        console.log('🎉 ALL ASSET OPERATIONS COMPLETED SUCCESSFULLY!');
    });
});