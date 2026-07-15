---
mode: agent
description: 'Turn a user story into Playwright test cases for MSupport, using the Playwright MCP server to explore the live app and following this project''s POM + fixtures conventions.'
tools: ['codebase', 'search', 'editFiles', 'runCommands', 'playwright']
---

# Generate Playwright tests from a user story

You are generating end-to-end Playwright tests for the **MSupport-Automation** project.
Combine two sources of truth:

1. The **user story + acceptance criteria** provided below.
2. The **live application**, explored via the Playwright MCP browser tools, to derive real,
   stable locators instead of guessing.

## Inputs

- **User story:** ${input:story:Paste the user story here (As a..., I want..., so that...)}
- **Acceptance criteria:** ${input:criteria:Paste acceptance criteria / scenarios (Given/When/Then)}
- **Feature code:** ${input:feature:Short UPPERCASE feature code for test IDs, e.g. TICKET, ASSET, ORG}

## Before you start: refresh auth

The app requires login and tests reuse a saved session in `auth.json` (JWTs that expire).
Run the setup project first so the MCP browser session is authenticated:

```
npx playwright test --project=setup
```

The MCP server is already configured in `.vscode/mcp.json` to launch Chrome with
`--storage-state auth.json`, so once auth is refreshed the browser opens logged in.

## Workflow

1. **Understand the story.** Break the acceptance criteria into discrete test scenarios
   (happy path first, then edge/negative cases). List them before writing code.
2. **Explore the live app** with the Playwright MCP tools:
   - Navigate to the relevant feature under `${BASE_URL}` (from `.env`, e.g. https://qa.msupport.am).
   - Snapshot the page (accessibility tree / roles) to identify the real controls.
   - Capture stable selectors and any multi-step dialog flows before authoring.
3. **Reuse or create a Page Object** in `pages/`:
   - Follow existing conventions (see `pages/AssetsPage.ts`, `pages/LoginPage.ts`,
     `pages/AssetCreateDialog.ts`).
   - `constructor(readonly page: Page)`, `readonly` locators, `async` action methods.
   - Prefer an existing page object if the feature is already covered.
4. **Wire a fixture** in `fixtures/fixtures.ts` if a new page object is introduced,
   matching the existing test-scoped (`assetsPage`) or worker-scoped (`createTicketPage`)
   patterns. Add its type to `TestFixtures` / `WorkerFixtures`.
5. **Author the spec** in `tests/<feature>.spec.ts`.
6. **Route the project** in `playwright.config.ts` only if the new spec needs a different
   project than `chromium` (most won't — `chromium` already depends on `setup`).
7. **Run and iterate:**
   ```
   npx playwright test tests/<feature>.spec.ts --project=chromium
   ```
   Fix failures by re-inspecting the live app with MCP; do not weaken assertions to pass.

## Project conventions (must follow)

- Import the extended test: `import { test } from '../fixtures/fixtures';` (not `@playwright/test`).
- Group with `test.describe.serial(...)`; the project runs `workers: 1`, sequential.
- Put mutable test data at the top of the file; use `Date.now()` for uniqueness.
- Inject page objects via destructured fixtures: `async ({ assetsPage, ... }) => { ... }`.
- Test naming: `MSUP-{FEATURE}-TC{NUM}{suffix}_{Short description}`
  (e.g. `MSUP-TICKET-TC007a_Add Ticket`). Use the provided `${input:feature}`.
- Locator priority: `getByRole()` → `getByLabel()` → `getByPlaceholder()` → `locator(css)` (last resort).
  Use `{ exact: true }` and `.first()/.last()/.nth()` to disambiguate.
- Keep assertions (`expect`) inside page object methods where the existing code does so;
  keep spec files focused on the scenario flow.
- Do not hardcode credentials — read from `process.env` (see `.env` / `login.setup.ts`).

## Output

- New/updated files under `pages/`, `fixtures/fixtures.ts`, and `tests/<feature>.spec.ts`.
- A short summary of the scenarios covered and the exact command to run them.
