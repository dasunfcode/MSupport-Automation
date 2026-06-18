import { test } from '../fixtures/fixtures';

test.describe.serial('Organization CRUD flow', () => {
  const timestamp = Date.now();

  const orgName = `Test Organization ${timestamp}`;
  const updatedOrgName = `${orgName} Updated`;

  const email = `test+${timestamp}@gmail.com`;
  const phone = Math.floor(1000000000 + Math.random() * 9000000000).toString();

  test('MSUP-ORG-TC002_Add Organization', async ({ organizationsPage }) => {
    await organizationsPage.openAddOrganization();
    await organizationsPage.selectPartnerType();
    await organizationsPage.fillBasicDetails(orgName, phone, email);
    await organizationsPage.submitOrganization();
  });

  test('MSUP-ORG-TC003_Search Organization', async ({ organizationsPage }) => {
    await organizationsPage.searchOrganization(orgName);
    await organizationsPage.rowByName(orgName).waitFor();
  });

  test('MSUP-ORG-TC004_View Organization', async ({ organizationsPage }) => {
    await organizationsPage.sidePanel(orgName);
    await organizationsPage.expectVisible(orgName);
  });

  test('MSUP-ORG-TC005_Edit Organization', async ({ organizationsPage }) => {
    await organizationsPage.sidePanel(orgName);
    await organizationsPage.updateName(updatedOrgName);
    await organizationsPage.expectVisible(updatedOrgName);
  });

  test('MSUP-ORG-TC006_Delete Organization', async ({ organizationsPage }) => {
    await organizationsPage.openRowMenu(updatedOrgName);
    await organizationsPage.deactivateOrganization();
  });
});