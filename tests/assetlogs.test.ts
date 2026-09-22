import { test } from '../fixtures/fixtures';

test.describe.configure({ mode: 'serial' });

const SERIAL_SEARCH = '00001';

// Assets used across the asset detail / service flows.
const MPURE = 'MPU00001';
const MPRINT = 'MPR00001';

test('Verify navigation to assets page and search by serial number', async ({ assetsLiveData }) => {
    await assetsLiveData.navigateToAssetsPage();
    await assetsLiveData.searchAssetsBySerialNumber(SERIAL_SEARCH);
    await assetsLiveData.page.waitForTimeout(1000);
});

// ==================== MPURE (MPU00001) ====================

test('Verify that MPure Hardware logs open and verify table details', async ({ assetsLiveData }) => {
    await assetsLiveData.openMpureLogs();
    await assetsLiveData.verifyHardwareLogs();
    await assetsLiveData.closeSidePanel();
});

test('Verify that MPure Hardware logs sorting works', async ({ assetsLiveData }) => {
    await assetsLiveData.openMpureLogs();
    await assetsLiveData.verifyHardwareLogsSorting();
    await assetsLiveData.closeSidePanel();
});

test('Verify that MPure Hardware logs pagination works', async ({ assetsLiveData }) => {
    await assetsLiveData.openMpureLogs();
    await assetsLiveData.verifyHardwareLogsPagination();
    await assetsLiveData.closeSidePanel();
});

test('Verify that MPure Hardware logs filters work', async ({ assetsLiveData }) => {
    await assetsLiveData.openMpureLogs();
    await assetsLiveData.verifyHardwareLogFilters(
        {
            severity: 'WARNING',
            component: 'stepper/supply/stepper_3',
            errorCode: 'stepper/thermal_warning',
            startTimestamp: '01/01/2020',
            endTimestamp: '31/12/2027'
        }, 'mpure'
    );
    await assetsLiveData.closeSidePanel();
});

test('Verify that full MPure hardware log details are visible', async ({ assetsLiveData }) => {
    await assetsLiveData.openMpureLogs();
    await assetsLiveData.verifyFullHardwareLog('mpure');
    await assetsLiveData.closeSidePanel();
});

test('Verify that MPure asset info view shows details and related tickets', async ({ assetsLiveData }) => {
    await assetsLiveData.verifyAssetInfoView(MPURE);
});

test('Verify that MPure service view shows live data', async ({ assetsLiveData }) => {
    await assetsLiveData.verifyServiceLiveData(MPURE);
});

test('Verify that MPure connect opens the device link wizard', async ({ assetsLiveData }) => {
    await assetsLiveData.verifyConnectDeviceLink(MPURE);
});

// ==================== MPRINT (MPR00001) ====================

test('Verify that MPrint Hardware logs open and verify table details', async ({ assetsLiveData }) => {
    await assetsLiveData.openMprintLogs();
    await assetsLiveData.verifyHardwareLogs();
    await assetsLiveData.closeSidePanel();
});

test('Verify that MPrint Hardware logs sorting works', async ({ assetsLiveData }) => {
    await assetsLiveData.openMprintLogs();
    await assetsLiveData.verifyHardwareLogsSorting();
    await assetsLiveData.closeSidePanel();
});

test('Verify that MPrint Hardware logs pagination works', async ({ assetsLiveData }) => {
    await assetsLiveData.openMprintLogs();
    await assetsLiveData.verifyHardwareLogsPagination();
    await assetsLiveData.closeSidePanel();
});

test('Verify that MPrint Hardware logs filters work', async ({ assetsLiveData }) => {
    await assetsLiveData.openMprintLogs();
    await assetsLiveData.verifyHardwareLogFilters(
        {
            severity: 'WARNING',
            component: 'stepper/main/stepper_node_1',
            errorCode: 'stepper/homing_timeout',
            startTimestamp: '01/01/2020',
            endTimestamp: '31/12/2027'
        }, 'mprint'
    );
    await assetsLiveData.closeSidePanel();
});

test('Verify that full MPrint hardware log details are visible', async ({ assetsLiveData }) => {
    await assetsLiveData.openMprintLogs();
    await assetsLiveData.verifyFullHardwareLog('mprint');
    await assetsLiveData.closeSidePanel();
});

test('Verify that MPrint asset info view shows details and related tickets', async ({ assetsLiveData }) => {
    await assetsLiveData.verifyAssetInfoView(MPRINT);
});

test('Verify that MPrint service view shows live data', async ({ assetsLiveData }) => {
    await assetsLiveData.verifyServiceLiveData(MPRINT);
});

test('Verify that MPrint connect opens the device link wizard', async ({ assetsLiveData }) => {
    await assetsLiveData.verifyConnectDeviceLink(MPRINT);
});

