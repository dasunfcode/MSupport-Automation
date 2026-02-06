## Folder Structure

```
tests/
├── auth.setup.ts          # OTP login & save auth state
├── dashboard.spec.ts      # example logged-in test
├── organizations.spec.ts
utils/
├── emailOtpReader.ts      # OTP helper
auth.json                  # auto-generated, do not commit
playwright.config.ts
```

---

## Writing New Tests

1. **Do not add login or OTP steps** – session is already loaded.
2. Go directly to the page you want to test:

```ts
import { test, expect } from '@playwright/test';

test('user should see organizations page', async ({ page }) => {
  await page.goto('/dashboard/organizations');
  await expect(page.getByText('Organizations')).toBeVisible();
});
```

3. **Selectors**: prefer `getByRole` or `data-*` attributes for stability.

---

## Running Tests

```bash
npx playwright test        # run all tests
npx playwright test --headed  # run with UI
```

---

## Notes

* `auth.json` contains logged-in session, do **not commit**.
* All tests are independent; login is handled once by `auth.setup.ts`.
* Playwright config already sets up auth state for tests automatically.

