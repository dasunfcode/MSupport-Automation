import { test as base, Browser, Page } from '@playwright/test';
import { AssetsLiveData } from '../pages/AssetsLogs';
import { TicketPage } from '../pages/TicketsPage';
import { LoginPage } from '../pages/LoginPage';
import { OrganizationsPage } from '../pages/OrganizationsPage';
import { LogsPage } from '../pages/LogsPage';
import { AssetsPage } from '../pages/AssetsPage';
import { AssetCreateDialog } from '../pages/AssetCreateDialog';
import { AssetMCareDialog } from '../pages/AssetMCareDialog';

type Credentials = { email: string; password: string };

type WorkerFixtures = {
    assetsLiveData: AssetsLiveData;
    createTicketPage: (credentials?: Credentials) => Promise<{ ticketPage: TicketPage; page: Page }>;
};

type TestFixtures = {
    organizationsPage: OrganizationsPage;
    logsPage: LogsPage;
    loginPage: LoginPage;
    assetsPage: AssetsPage;
    assetCreateDialog: AssetCreateDialog;
    assetMCareDialog: AssetMCareDialog;
};

async function loginAs(browser: Browser, email: string, password: string): Promise<Page> {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    await loginPage.goto(process.env.BASE_URL || '');
    await loginPage.login(email, password);
    await loginPage.verifyDashboard();
    return page;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
    organizationsPage: async ({ page }, use) => {
        const organizationsPage = new OrganizationsPage(page);
        await organizationsPage.goto();
        await use(organizationsPage);
    },

    logsPage: async ({ page }, use) => {
        const logsPage = new LogsPage(page);
        await logsPage.goto();
        await use(logsPage);
    },

    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },

    assetsPage: async ({ page }, use) => {
        await use(new AssetsPage(page));
    },

    assetCreateDialog: async ({ page }, use) => {
        await use(new AssetCreateDialog(page));
    },

    assetMCareDialog: async ({ page }, use) => {
        await use(new AssetMCareDialog(page));
    },

    assetsLiveData: [
        async ({ browser }, use) => {
            const page = await browser.newPage();
            const assetsLiveData = new AssetsLiveData(page);
            await use(assetsLiveData);
            await page.close();
        },
        { scope: 'worker' },
    ],

    createTicketPage: [
        async ({ browser }, use) => {
            const pagesToClose: Page[] = [];
            await use(async (credentials?: Credentials) => {
                const page = credentials
                    ? await loginAs(browser, credentials.email, credentials.password)
                    : await browser.newPage();
                pagesToClose.push(page);
                const ticketPage = new TicketPage(page);
                await ticketPage.goto();
                return { ticketPage, page };
            });
            for (const p of pagesToClose) {
                if (!p.isClosed()) await p.close();
            }
        },
        { scope: 'worker' },
    ],
});

export { expect } from '@playwright/test';
