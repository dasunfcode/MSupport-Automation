import { test } from '../fixtures/fixtures';

test.describe.configure({ mode: 'serial' });

test('Verify navigation to assets page and search by serial number', async ({ assetsLiveData }) => {
    await assetsLiveData.navigateToAssetsPage();
    await assetsLiveData.searchAssetsBySerialNumber('00001');
});

test('Verify that MPure Hardware logs open and verify table details', async ({ assetsLiveData }) => {
    await assetsLiveData.openMpureLogs();
    await assetsLiveData.verifyHardwareLogs(1111);
});

test('Verify that MPure Hardware logs sorting, pagination and filters work', async ({ assetsLiveData }) => {
    await assetsLiveData.verifyHardwareLogsSorting();
    await assetsLiveData.verifyHardwareLogsPagination();
    await assetsLiveData.verifyHardwareLogFilters(
        {
            severity: 'WARNING',
            component: 'stepper/supply/stepper_1',
            errorCode: 'stepper/thermal_warning',
            startTimestamp: '20/05/2021',
            endTimestamp: '20/05/2026'
        }, 'mpure'
    );
});

test('Verify that full MPure hardware log details are visible', async ({ assetsLiveData }) => {
    await assetsLiveData.verifyFullHardwareLog('mpure');
});

test('Verify that MPrint Hardware logs open and verify table details', async ({ assetsLiveData }) => {
    await assetsLiveData.openMprintLogs();
    await assetsLiveData.verifyHardwareLogs(22222);
});

test('Verify that MPrint Hardware logs sorting, pagination and filters work', async ({ assetsLiveData }) => {
    await assetsLiveData.verifyHardwareLogsSorting();
    await assetsLiveData.verifyHardwareLogsPagination();
    await assetsLiveData.verifyHardwareLogFilters(
        {
            severity: 'WARNING',
            component: 'o2_sensor_v1',
            errorCode: 'o2_sensor/invalid_value',
            startTimestamp: '30/06/2022',
            endTimestamp: '13/05/2026'
        }, 'mprint'
    );
});

test('Verify that full MPrint hardware log details are visible', async ({ assetsLiveData }) => {
    await assetsLiveData.verifyFullHardwareLog('mprint');
});