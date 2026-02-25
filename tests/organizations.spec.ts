import { test } from '@playwright/test';
import { OrganizationsPage } from '../pages/OrganizationsPage';

test.describe.serial('Organization CRUD flow', () => {
  const timestamp = Date.now();

  let orgName = `Test Organization ${timestamp}`;
  let updatedOrgName = `${orgName} Updated`;

  const email = `test+${timestamp}@gmail.com`;
  const phone = Math.floor(1000000000 + Math.random() * 9000000000).toString();

  test('MSUP-ORG-TC002_Add Organization', async ({ page }) => {
    const orgPage = new OrganizationsPage(page);

    await orgPage.goto();
    await orgPage.openAddOrganization();
    await orgPage.selectPartnerType();
    await orgPage.fillBasicDetails(orgName, phone, email);
    await orgPage.submitOrganization();
  });

  test('MSUP-ORG-TC003_Search Organization', async ({ page }) => {
    const orgPage = new OrganizationsPage(page);

    await orgPage.goto();
    await orgPage.searchOrganization(orgName);

    await orgPage.rowByName(orgName).waitFor();
  });

  test('MSUP-ORG-TC004_View Organization', async ({ page }) => {
    const orgPage = new OrganizationsPage(page);

    await orgPage.goto();
    await orgPage.openRowMenu(orgName);
    await orgPage.clickView();
    await orgPage.expectVisible(orgName);
  });

  test('MSUP-ORG-TC005_Edit Organization', async ({ page }) => {
    const orgPage = new OrganizationsPage(page);

    await orgPage.goto();
    await orgPage.openRowMenu(orgName);
    await orgPage.clickEdit();
    await orgPage.updateName(updatedOrgName);
    await orgPage.expectVisible(updatedOrgName);
  });

  test('MSUP-ORG-TC006_Delete Organization', async ({ page }) => {
    const orgPage = new OrganizationsPage(page);

    await orgPage.goto();
    await orgPage.openRowMenu(updatedOrgName);
    await orgPage.deactivateOrganization();
  });
});