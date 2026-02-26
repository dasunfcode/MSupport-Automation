This framework is for the **MSupport project** and covers all key CRUD operations. Built with **Playwright and TypeScript** using the **Page Object Model (POM)**, it supports **real OTP login via email**. The authenticated session is reused across tests using `storageState`, making tests faster and more reliable. It provides a simple, maintainable way to test all critical features.

---

## Tech Stack

* Playwright Test Runner
* TypeScript
* Node.js
* dotenv (environment configuration)
* mail-listener2 (OTP email retrieval)
* HTML & JSON reporting

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
npx playwright install
```

### 2. Configure Environment

Create a `.env` file in the root:

```
BASE_URL=
EMAIL=
PASSWORD=
EMAIL_PASSWORD=
AUTH_JSON_PATH=auth.json
OTP_TIMEOUT=60000
```

> ⚠️ Never commit `.env` or `auth.json`.

### 3. Run Tests

* Run all tests:

```bash
npx playwright test
```

* Run in headed mode:

```bash
npx playwright test --headed
```

* View HTML report:

```bash
npx playwright show-report
```

---

## Authentication Flow

1. `auth.setup.ts` executes first.
2. User logs in with email + password.
3. OTP is sent to email and read via IMAP.
4. OTP is entered into the UI.
5. Authenticated session is saved in `auth.json`.
6. All tests reuse this session.

This avoids repeated login and improves execution speed and stability.

---

## Project Structure

```
tests/
├── auth.setup.ts          # OTP login & save auth state
├── dashboard.spec.ts      # example logged-in test
├── organizations.spec.ts  # feature tests

pages/
├── LoginPage.ts
├── DashboardPage.ts
├── OrganizationsPage.ts   # Page Object classes

utils/
├── emailOtpReader.ts      # OTP helper

auth.json                  # auto-generated, do not commit
playwright.config.ts
```

---

## Writing a New Test

**Do not include login or OTP steps.**
The authenticated session is preloaded via `auth.json`.

### Step 1: Create Page Object

```ts
// pages/ReportsPage.ts
import { Page, expect } from '@playwright/test';

export class ReportsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard/reports');
  }

  async verifyPageLoaded() {
    await expect(this.page.getByRole('heading', { name: 'Reports' }))
      .toBeVisible();
  }
}
```

### Step 2: Create Test File

```ts
// tests/reports.spec.ts
import { test } from '@playwright/test';
import { ReportsPage } from '../pages/ReportsPage';

test('User should access Reports page successfully', async ({ page }) => {
  const reportsPage = new ReportsPage(page);

  await reportsPage.goto();
  await reportsPage.verifyPageLoaded();
});
```

### Step 3: Run the Test

```bash
npx playwright test tests/reports.spec.ts
```

---

## Selector Strategy

* Prefer `getByRole()`
* Use `data-*` attributes (`data-testid`)
* Avoid fragile CSS selectors
* Avoid dynamic text selectors unless necessary

---

## Reporting & Artifacts

* Automatic screenshot, video, and trace capture on failure
* HTML and JSON reports
* Stored in:

```
test-results/
```

---

