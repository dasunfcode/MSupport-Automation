# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: assetlogs.test.ts >> Verify that MPure Hardware logs open and verify table details
- Location: tests\assetlogs.test.ts:12:5

# Error details

```
TimeoutError: locator.waitFor: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('row').filter({ hasText: /mpure/i }).first() to be visible

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e5]: M
      - generic [ref=e6]:
        - link "Organizations" [ref=e7] [cursor=pointer]:
          - /url: /dashboard/organizations
          - img [ref=e8]
          - generic [ref=e10]: Organizations
        - link "Users" [ref=e11] [cursor=pointer]:
          - /url: /dashboard/users
          - img [ref=e12]
          - generic [ref=e14]: Users
        - link "Assets" [ref=e15] [cursor=pointer]:
          - /url: /dashboard/assets
          - img [ref=e16]
          - generic [ref=e20]: Assets
        - link "Tickets" [ref=e21] [cursor=pointer]:
          - /url: /dashboard/tickets
          - img [ref=e22]
          - generic [ref=e26]: Tickets
        - link "Analytics" [ref=e27] [cursor=pointer]:
          - /url: /dashboard/analytics
          - img [ref=e28]
          - generic [ref=e30]: Analytics
        - link "Logs" [ref=e31] [cursor=pointer]:
          - /url: /dashboard/logs
          - img [ref=e32]
          - generic [ref=e36]: Logs
    - main [ref=e37]:
      - generic [ref=e39]:
        - heading "Asset Management" [level=1] [ref=e41]
        - generic [ref=e42]:
          - generic [ref=e43]:
            - button "Add New Asset" [ref=e44] [cursor=pointer]:
              - img
              - generic [ref=e45]: Add New Asset
            - button "View Export Asset Data" [ref=e46] [cursor=pointer]:
              - img "View" [ref=e47]
              - generic [ref=e48]: Export Asset Data
          - button [ref=e49] [cursor=pointer]:
            - img [ref=e50]
          - button "Hello, Test User 22! T2" [ref=e53] [cursor=pointer]:
            - generic [ref=e54]:
              - generic [ref=e55]: Hello, Test User 22!
              - generic [ref=e56]: T2
      - generic [ref=e59]:
        - generic [ref=e62]:
          - generic [ref=e64]:
            - textbox "Search..." [active] [ref=e66]: "00001"
            - img [ref=e67]
          - generic [ref=e70]:
            - button "Filters" [ref=e71] [cursor=pointer]:
              - img [ref=e72]
              - generic [ref=e74]: Filters
            - button [ref=e75] [cursor=pointer]:
              - img [ref=e76]
        - generic [ref=e79]:
          - table [ref=e86]:
            - rowgroup [ref=e87]:
              - row "Serial Number Asset Name Asset Type Location Installation Date Ex Works Date Reference Date Related Contact MCare Status Live Status Asset Status Actions" [ref=e88]:
                - columnheader "Serial Number" [ref=e89]:
                  - button "Serial Number" [ref=e90] [cursor=pointer]:
                    - generic [ref=e91]: Serial Number
                    - img [ref=e92]
                - columnheader "Asset Name" [ref=e94]:
                  - button "Asset Name" [ref=e95] [cursor=pointer]:
                    - generic [ref=e96]: Asset Name
                    - img [ref=e97]
                - columnheader "Asset Type" [ref=e99]:
                  - button "Asset Type" [ref=e100] [cursor=pointer]:
                    - generic [ref=e101]: Asset Type
                    - img [ref=e102]
                - columnheader "Location" [ref=e104]:
                  - button "Location" [ref=e105] [cursor=pointer]:
                    - generic [ref=e106]: Location
                    - img [ref=e107]
                - columnheader "Installation Date" [ref=e109]:
                  - button "Installation Date" [ref=e110] [cursor=pointer]:
                    - generic [ref=e111]: Installation Date
                    - img [ref=e112]
                - columnheader "Ex Works Date" [ref=e114]:
                  - button "Ex Works Date" [ref=e115] [cursor=pointer]:
                    - generic [ref=e116]: Ex Works Date
                    - img [ref=e117]
                - columnheader "Reference Date" [ref=e119]:
                  - button "Reference Date" [ref=e120] [cursor=pointer]:
                    - generic [ref=e121]: Reference Date
                    - img [ref=e122]
                - columnheader "Related Contact" [ref=e124]:
                  - button "Related Contact" [ref=e125] [cursor=pointer]:
                    - generic [ref=e126]: Related Contact
                    - img [ref=e127]
                - columnheader "MCare Status" [ref=e129]:
                  - button "MCare Status" [ref=e130] [cursor=pointer]:
                    - generic [ref=e131]: MCare Status
                    - img [ref=e132]
                - columnheader "Live Status" [ref=e134]:
                  - button "Live Status" [ref=e135] [cursor=pointer]:
                    - generic [ref=e136]: Live Status
                    - img [ref=e137]
                - columnheader "Asset Status" [ref=e139]:
                  - button "Asset Status" [ref=e140] [cursor=pointer]:
                    - generic [ref=e141]: Asset Status
                    - img [ref=e142]
                - columnheader "Actions" [ref=e144]
            - rowgroup [ref=e145]:
              - row "MPR00001 MPR00001 MPRINT - - 06/03/2026 - No Printing New" [ref=e146] [cursor=pointer]:
                - cell "MPR00001" [ref=e147]:
                  - generic [ref=e148]: MPR00001
                - cell "MPR00001" [ref=e149]:
                  - generic [ref=e150]: MPR00001
                - cell "MPRINT" [ref=e151]:
                  - generic [ref=e152]: MPRINT
                - cell [ref=e153]
                - cell "-" [ref=e154]:
                  - generic [ref=e155]: "-"
                - cell "-" [ref=e156]:
                  - generic [ref=e157]: "-"
                - cell "06/03/2026" [ref=e158]:
                  - generic [ref=e159]: 06/03/2026
                - cell "-" [ref=e160]:
                  - generic [ref=e161]: "-"
                - cell "No" [ref=e162]:
                  - generic [ref=e163]: "No"
                - cell "Printing" [ref=e164]:
                  - generic [ref=e165]: Printing
                - cell "New" [ref=e166]:
                  - generic [ref=e167]: New
                - cell [ref=e168]:
                  - button [ref=e170]:
                    - img
              - row "MBS00001 Asset 01 Standard Modul - - - - No Unknown Running" [ref=e171] [cursor=pointer]:
                - cell "MBS00001" [ref=e172]:
                  - generic [ref=e173]: MBS00001
                - cell "Asset 01" [ref=e174]:
                  - generic [ref=e175]: Asset 01
                - cell "Standard Modul" [ref=e176]:
                  - generic [ref=e177]: Standard Modul
                - cell [ref=e178]
                - cell "-" [ref=e179]:
                  - generic [ref=e180]: "-"
                - cell "-" [ref=e181]:
                  - generic [ref=e182]: "-"
                - cell "-" [ref=e183]:
                  - generic [ref=e184]: "-"
                - cell "-" [ref=e185]:
                  - generic [ref=e186]: "-"
                - cell "No" [ref=e187]:
                  - generic [ref=e188]: "No"
                - cell "Unknown" [ref=e189]:
                  - generic [ref=e190]: Unknown
                - cell "Running" [ref=e191]:
                  - generic [ref=e192]: Running
                - cell [ref=e193]:
                  - button [ref=e195]:
                    - img
              - row "MBL00001 Asset 01 Lab Modul - - - - No Unknown Running" [ref=e196] [cursor=pointer]:
                - cell "MBL00001" [ref=e197]:
                  - generic [ref=e198]: MBL00001
                - cell "Asset 01" [ref=e199]:
                  - generic [ref=e200]: Asset 01
                - cell "Lab Modul" [ref=e201]:
                  - generic [ref=e202]: Lab Modul
                - cell [ref=e203]
                - cell "-" [ref=e204]:
                  - generic [ref=e205]: "-"
                - cell "-" [ref=e206]:
                  - generic [ref=e207]: "-"
                - cell "-" [ref=e208]:
                  - generic [ref=e209]: "-"
                - cell "-" [ref=e210]:
                  - generic [ref=e211]: "-"
                - cell "No" [ref=e212]:
                  - generic [ref=e213]: "No"
                - cell "Unknown" [ref=e214]:
                  - generic [ref=e215]: Unknown
                - cell "Running" [ref=e216]:
                  - generic [ref=e217]: Running
                - cell [ref=e218]:
                  - button [ref=e220]:
                    - img
          - generic [ref=e222]:
            - generic [ref=e223]:
              - button [disabled]:
                - img
              - button "1" [ref=e224] [cursor=pointer]
              - button [disabled]:
                - img
            - generic [ref=e225]:
              - paragraph [ref=e226]: Show
              - combobox [ref=e227]:
                - generic: "20"
                - img
              - paragraph [ref=e228]: rows per page
  - region "Notifications alt+T"
  - alert [ref=e229]
```

# Test source

```ts
  1   | import { Page, Locator, expect } from '@playwright/test';
  2   | 
  3   | export class AssetsLiveData {
  4   |     readonly page: Page;
  5   | 
  6   |     constructor(page: Page) {
  7   |         this.page = page;
  8   |     }
  9   | 
  10  |     async navigateToAssetsPage() {
  11  |         await this.page.goto('/dashboard/assets');
  12  |     }
  13  | 
  14  |     async searchAssetsBySerialNumber(searchTerm: string) {
  15  |         const searchBar: Locator = this.page.getByRole('textbox', { name: 'Search...' });
  16  | 
  17  |         // Wait for the search input to be visible
  18  |         await searchBar.waitFor({ state: 'visible', timeout: 10000 });
  19  | 
  20  |         // Clear any existing value, focus and type the search term with a delay
  21  |         await searchBar.fill('');
  22  |         await searchBar.focus();
  23  |         await searchBar.fill(searchTerm, { timeout: 10000 });
  24  | 
  25  |         // Wait until at least one real asset row (with an action button) is rendered
  26  |         await this.page
  27  |             .getByTestId(/^action-asset-btn-/)
  28  |             .first()
  29  |             .waitFor({ state: 'visible', timeout: 15000 });
  30  |     }
  31  | 
  32  |     // Method to open Mpure logs
  33  |     async openMpureLogs() {
  34  |         await this.goToAssetsAndSearch('00001');
  35  |         await this.openHardwareLogsForMachine('mpure');
  36  |     }
  37  | 
  38  |     // Method to open Mprint logs
  39  |     async openMprintLogs() {
  40  |         await this.goToAssetsAndSearch('00001');
  41  |         await this.openHardwareLogsForMachine('mprint');
  42  |     }
  43  | 
  44  |     private async goToAssetsAndSearch(searchTerm: string) {
  45  |         await this.navigateToAssetsPage();
  46  |         await this.searchAssetsBySerialNumber(searchTerm);
  47  |     }
  48  | 
  49  |     /**
  50  |      * Opens the hardware logs view for the asset whose row matches the given
  51  |      * machine type. The serial number search is fixed at the test level
  52  |      * (always '00001'), and rows are disambiguated by the machine-type label
  53  |      * rendered in the row — so this works across environments regardless of
  54  |      * row ordering or seeded UUIDs.
  55  |      */
  56  |     private async openHardwareLogsForMachine(machineType: 'mpure' | 'mprint') {
  57  |         const machineLabel = machineType === 'mpure' ? /mpure/i : /mprint/i;
  58  | 
  59  |         const row: Locator = this.page
  60  |             .getByRole('row')
  61  |             .filter({ hasText: machineLabel })
  62  |             .first();
> 63  |         await row.waitFor({ state: 'visible', timeout: 15000 });
      |                   ^ TimeoutError: locator.waitFor: Timeout 15000ms exceeded.
  64  | 
  65  |         const actionButton: Locator = row.getByTestId(/^action-asset-btn-/);
  66  |         await actionButton.waitFor({ state: 'visible', timeout: 15000 });
  67  |         await actionButton.scrollIntoViewIfNeeded();
  68  | 
  69  |         const actionTestId = await actionButton.getAttribute('data-testid');
  70  |         if (!actionTestId) {
  71  |             throw new Error(`Unable to resolve action button testid for ${machineType} row`);
  72  |         }
  73  | 
  74  |         const viewTestId = actionTestId.replace('action-asset-btn-', 'view-asset-btn-');
  75  |         const viewButton: Locator = this.page.getByTestId(viewTestId);
  76  | 
  77  |         // Radix-style dropdowns occasionally swallow the first click while still
  78  |         // animating in. Retry until the View item is actually visible.
  79  |         await expect(async () => {
  80  |             await actionButton.click();
  81  |             await expect(viewButton).toBeVisible({ timeout: 2000 });
  82  |         }).toPass({ timeout: 10000 });
  83  | 
  84  |         await viewButton.click();
  85  | 
  86  |         const hardwareLogsButton: Locator = this.page.getByRole('button', { name: 'Hardware Logs' });
  87  |         await hardwareLogsButton.waitFor({ state: 'visible', timeout: 10000 });
  88  |         await hardwareLogsButton.click();
  89  |     }
  90  | 
  91  |     async verifyHardwareLogs(searchId: number) {
  92  |         // Verify the columns of the hardware logs table
  93  |         const columns = ['ID', 'Severity', 'Component', 'Error Code', 'Message', 'Timestamp', 'Actions'];
  94  |         for (const column of columns) {
  95  |             await this.page.getByRole('columnheader', { name: column, exact: true }).waitFor({ state: 'visible', timeout: 10000 });
  96  |         }
  97  | 
  98  |         //verify that the search bar is working in hardware logs table
  99  |         const searchBar: Locator = this.page.getByRole('textbox', { name: 'Search hardware logs...' });
  100 |         const searchTerm = searchId.toString();
  101 |         await searchBar.waitFor({ state: 'visible', timeout: 10000 });
  102 |         await searchBar.fill('');
  103 |         await searchBar.focus();
  104 |         await searchBar.fill(searchTerm, { timeout: 10000 });
  105 |         const row: Locator = this.page.getByRole('cell', {name: searchTerm});
  106 |         await row.first().waitFor({ state: 'visible', timeout: 10000 });
  107 |         await searchBar.fill('');
  108 |     }
  109 | 
  110 |     // Method to verify hardware logs table sorting works
  111 |     async verifyHardwareLogsSorting() {
  112 |         const columnTypes: { name: string; index: number; type: 'number' | 'date' | 'string' }[] = [
  113 |             { name: 'ID', index: 0, type: 'number' },
  114 |             { name: 'Severity', index: 1, type: 'string' },
  115 |             { name: 'Component', index: 2, type: 'string' },
  116 |             { name: 'Error Code', index: 3, type: 'string' },
  117 |             { name: 'Message', index: 4, type: 'string' },
  118 |             { name: 'Timestamp', index: 5, type: 'date' },
  119 |         ];
  120 | 
  121 |         for (const col of columnTypes) {
  122 |             await this.verifyColumnSort(col.name, col.index, col.type);
  123 |         }
  124 |     }
  125 | 
  126 |     private async verifyColumnSort(
  127 |         columnName: string,
  128 |         columnIndex: number,
  129 |         type: 'number' | 'date' | 'string'
  130 |     ) {
  131 |         const header: Locator = this.page.getByRole('columnheader', { name: columnName, exact: true });
  132 |         const sortButton: Locator = header.getByRole('button').first();
  133 |         const clickTarget: Locator = (await sortButton.count()) > 0 ? sortButton : header;
  134 | 
  135 |         // Ascending
  136 |         await clickTarget.click();
  137 |         await this.page.waitForTimeout(500);
  138 |         const ascValues = await this.getColumnValues(columnIndex);
  139 |         expect(this.isSorted(ascValues, type, 'asc'), `${columnName} should be sorted ascending`).toBe(true);
  140 | 
  141 |         // Descending
  142 |         await clickTarget.click();
  143 |         await this.page.waitForTimeout(500);
  144 |         const descValues = await this.getColumnValues(columnIndex);
  145 |         expect(this.isSorted(descValues, type, 'desc'), `${columnName} should be sorted descending`).toBe(true);
  146 |     }
  147 | 
  148 |     private async getColumnValues(columnIndex: number): Promise<string[]> {
  149 |         const rows: Locator = this.page.getByRole('row');
  150 |         const count = await rows.count();
  151 |         const values: string[] = [];
  152 |         // Skip header row at index 0
  153 |         for (let i = 1; i < count; i++) {
  154 |             const cells = rows.nth(i).getByRole('cell');
  155 |             if ((await cells.count()) <= columnIndex) continue;
  156 |             const text = (await cells.nth(columnIndex).innerText()).trim();
  157 |             if (text.length > 0) values.push(text);
  158 |         }
  159 |         return values;
  160 |     }
  161 | 
  162 |     private isSorted(
  163 |         values: string[],
```