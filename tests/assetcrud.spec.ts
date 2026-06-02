import { test } from '../fixtures/fixtures';

// ==================== EASY-TO-CHANGE TEST DATA ====================
const ASSET_NAME = `Test Asset ${Date.now()}`;
const LOCATION = 'Colombo';
const UPDATED_LOCATION = 'Berlin';
const RELATED_CONTACT = 'Lakindu';
const ORGANIZATION = 'Fcode labs';
const DESTINATION_COUNTRY = 'Sri Lanka';
const NOTES = 'Test asset created via automation';
const MCARE_PACKAGE = 'MCare +1 year - 1 Month';

test.describe.serial('Asset CRUD flow - NO LOGIN', () => {
    test('TC004a_Create_New_Asset', async ({ assetsPage, assetCreateDialog }) => {
        await assetsPage.navigateTo();
        await assetsPage.clickAddNewAsset();

        await assetCreateDialog.fillBasicInformation(ASSET_NAME);
        await assetCreateDialog.fillLocationAndDates(LOCATION, RELATED_CONTACT, ORGANIZATION);
        await assetCreateDialog.fillEndCustomerAndNotes(DESTINATION_COUNTRY, NOTES);
        await assetCreateDialog.submit();
    });

    test('TC004b_View_Asset', async ({ assetsPage }) => {
        await assetsPage.navigateTo();
        await assetsPage.viewFirstAsset();
    });

    test('TC004c_Manage_MCare_Packages', async ({ assetsPage, assetMCareDialog }) => {
        await assetsPage.navigateTo();
        await assetsPage.openManageMCareForFirstAsset();
        await assetMCareDialog.addBookedMCare(MCARE_PACKAGE);
        await assetMCareDialog.addYearlyMaintenance();
        await assetMCareDialog.update();
    });

    test('TC004d_Edit_Asset', async ({ assetsPage }) => {
        await assetsPage.navigateTo();
        await assetsPage.editFirstAsset(UPDATED_LOCATION);
    });

    test('TC004e_Delete_Asset', async ({ assetsPage }) => {
        await assetsPage.navigateTo();
        await assetsPage.deleteFirstAsset();
    });
});
