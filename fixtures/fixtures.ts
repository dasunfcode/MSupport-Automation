import { test as base } from '@playwright/test';
import { AssetsLiveData } from '../pages/AssetsLogs';

type Fixtures = {
    assetsLiveData: AssetsLiveData;
};

export const test = base.extend<{}, Fixtures>({
    assetsLiveData: [
        async ({ browser }, use) => {
            const page = await browser.newPage();
            const assetsLiveData = new AssetsLiveData(page);
            await use(assetsLiveData);
            await page.close();
        },
        { scope: 'worker' },
    ],
});

export { expect } from '@playwright/test';
