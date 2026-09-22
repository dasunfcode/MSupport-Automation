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

- **User story:** ${input:story:User Dashboard → As an MSUPPORT user, I should be able to view my personalized dashboard to quickly understand my tickets, connected assets, notifications, and items requiring immediate attention.

Main Flow
Login → Dashboard

Business Rules
The Dashboard is the default landing page displayed after the user successfully logs into the system.

The user should be able to view a personalized greeting displaying their name as follows.

“Hi [name] - here’s where to focus today.”

“[number] tickets on your desk, [number] connected assets. Service Manager”

The user should be able to view the total number of tickets currently assigned to them with .

The user should be able to view the total number of connected assets available within their organization.

The user should be able to view their assigned user role.

The user should be able to view a summary of their assigned tickets categorized by status.

The user should be able to view the total number of Open and Waiting tickets assigned to them.

The user should be able to view a summary of connected assets categorized by their operational status.

The user should be able to view the percentage distribution of assets for each operational status.

The user should be able to view tickets that have remained inactive for the longest duration under the Tickets Needs Attention section.

The user should be able to view assets requiring operational attention under the Assets Needs Attention section.

The user should be able to view the latest tickets assigned to them under the New Tickets section.

The user should be able to view notifications ordered from the newest to the oldest.

The user should only be able to view tickets, assets, and notifications they are authorized to access based on their assigned organization and user permissions.

The user should be able to view updated dashboard information whenever ticket, asset, or notification data changes.

Dashboard Header
Field Name

Field Type

Mandatory / Optional

Description

Field Name

Field Type

Mandatory / Optional

Description

Greeting

Text

Mandatory

Displays a personalized greeting using the logged-in user's name.

Assigned Tickets

Summary

Mandatory

Displays the total number of tickets assigned to the logged-in user.

Connected Assets

Summary

Mandatory

Displays the total number of connected assets available to the user.

User Role

Text

Mandatory

Displays the logged-in user's assigned role.

My Tickets
Field Name

Field Type

Place holder

Mandatory / Optional

Description

Header

Text

“My tickets”

Mandatory

 

Subheading

Text

“Assigned to  [username]”

Mandatory

 

Ticket Status Summary

Status Chart

 

Mandatory

Displays ticket distribution grouped by status.

To do

Waiting Internal

Waiting External

text - number

To do [ number]

In progress[number]

Waiting [number]Eternal

Mandatory

 

Open Tickets

Counter

 

Mandatory

Displays the total number of open tickets assigned to the user.

Waiting Tickets

Counter

 

Mandatory

Displays the total number of waiting tickets assigned to the user.

Business Rules
The user should be able to view only tickets assigned to them.

The user should be able to view ticket counts automatically updated whenever ticket statuses change.

The user should be able to identify ticket distribution through the status summary.

The following color palette should be used to indicate the ticket types.

To do - red

In progress - Blue

Waiting External - Yellow

Assets
Field Name

Field Type

Placeholder

Mandatory / Optional

Description

Header

Text

“Assets”

Mandatory

 

Subheading

Text

“Operational state across [number of total connected machines] connected machines”

Mandatory

 

Asset Status Summary

Status Chart

 

Mandatory

Displays connected assets grouped by operational status.

Error

Idle

Preparing

Printing

Paused

Unknown

Online 

Offline

Counter

[number]

[percentage]

[state]

Mandatory

Displays the total number of printing assets.

Business Rules
The user should be able to view only assets accessible to them. Decide whether we go only with the assigned ones, or have a seperate one to display all.

The user should be able to view asset percentages calculated based on the total number of connected assets.

The user should be able to identify the operational status distribution of connected assets.

The printing statuses should be displayed in differeny colors as follows.

Online - Green

Printing - Blue

Error - Red

Offine - Grey

Tickets Needs Attention
Field Name

Field Type

Placeholder

Mandatory / Optional

Description

Header

Text

“Tickets need attention”

Mandatory

 

Subheading

Text

“Open tickets gone quiet the longest — most neglected first”

Mandatory

 

Ticket ID

Label

“#[ID]

Mandatory

Displays the ticket reference number.

Ticket Name

Text

“[ticket number]”

Mandatory

Displays the ticket title.

Organization

Text

‘[org name]’

Mandatory

Displays the organization associated with the ticket.

Asset

Text

‘[asset name]’

Mandatory

Displays the related asset.

Status

Badge

“[status]”

Mandatory

Displays the current ticket status.

Last Updated

Timestamp

“[number of days/hours/mins] ago”

Mandatory

Displays the latest activity timestamp.

Business Rules
The user should be able to view tickets ordered by the longest period of inactivity.

The user should be able to identify tickets requiring immediate attention.

The user should be able to view only active tickets requiring follow-up.

Logic should be → 

To do tickets that has not done for a duration of 1 week.

Any ticket with a ticket status not engaged for 40 hours.

Assets Needs Maintenance
Field Name

Field Type

Placeholder

Mandatory / Optional

Description

Header

Text

“Assets need maintenance”

Mandatory

 

Subheading

Text

“Upcoming maintenance”

Mandatory

 

Number of Assets need maintenance

Counter

 

 

 

Asset ID

Label

 

Mandatory

Displays the asset identifier.

Organization

Text

 

Mandatory

Displays the organization name.

Location

Text

 

Mandatory

Displays the asset location.

Asset Status

Badge

 

Mandatory

Displays the current operational status.

Last Updated

Timestamp

 

Mandatory

Displays the latest asset activity time.

Business Rules
The user should be able to identify assets experiencing operational issues or awaiting maintenance.

Sorting will be done by how much time has already left for the asset to get their maintenance date expired.

Less time remaining → urgent → show on top

Assets with errors
Field Name

Field Type

Placeholder

Mandatory / Optional

Description

Header

Text

“Assets with errors”

Mandatory

 

Subheading

Text

“Errors”

Mandatory

 

Number of Assets with errors

Counter

 

Mandatory

 

Asset ID

Label

 

Mandatory

Displays the asset identifier.

Organization

Text

 

Mandatory

Displays the organization name.

Location

Text

 

Mandatory

Displays the asset location.

Asset Status

Badge

 

Mandatory

Displays the current operational status.

Last Updated

Timestamp

 

Mandatory

Displays the latest asset activity time.

Business Rules
The user should be able to identify assets experiencing operational issues or awaiting maintenance.

Sorting will be done by how much time has already left since its in error state.

New Tickets
Field Name

Field Type

Placeholder

Mandatory / Optional

Description

Header

Text

“New tickets”

Mandatory

 

Subheading

Text

“Tickets touched during your time away — freshest first”

Mandatory

 

Ticket ID

Label

 

Mandatory

Displays the ticket number.

Ticket Name

Text

 

Mandatory

Displays the ticket title.

Organization

Text

 

Mandatory

Displays the associated organization.

Asset

Text

 

Mandatory

Displays the related asset.

Status

Badge

ticket statuses

Mandatory

Displays the ticket status.

Created Time

Timestamp

 

Mandatory

Displays when the ticket was created or assigned.

Business Rules
The user should be able to view the newest assigned tickets first.

The user should be able to identify recently assigned tickets requiring attention.

Notifications
Field Name

Field Type

Placeholder

Mandatory / Optional

Description

Header

Text

'Notifications”

Mandatory

 

Subheading

Text

“Newest at the top”

Mandatory

 

Number of Notifications

counter

[Number of notifications]

Mandatory

 

Notification Icon

Icon

 

Mandatory

Indicates the notification severity.

Notification Message

Text

 

Mandatory

Displays the notification content.

Notification Time

Timestamp

 

Mandatory

Displays when the notification was generated.

Business Rules
The user should be able to view notifications ordered from the newest to the oldest.

The user should be able to distinguish notification severity using the corresponding notification icon.

The user should be able to identify the total number of unread notifications from the notification badge.

Notifications should be categorized with their icons according to the notificatoon type.

Green - Success

Orange - Warning

Red - Danger}
- **Acceptance criteria:** ${input:criteria:Verify that upon successful login, the user is redirected to the Dashboard.

Verify that the dashboard displays a personalized greeting using the logged-in user's name.

Verify that the dashboard displays the total number of tickets assigned to the user divided in status types.

Verify that the dashboard displays the total number of connected assets available to the user.

Verify that the dashboard displays the logged-in user's role.

Verify that the My Tickets widget displays the total number of Open and Waiting tickets assigned to the user.

Verify that the ticket status summary correctly displays ticket distribution by status.

Verify that the Assets widget displays the total number of connected assets grouped by their operational status.

Verify that the asset status summary displays the percentage distribution of assets by status.

Verify that the Tickets Needs Attention widget displays tickets that have remained inactive for the longest period.

Verify that each ticket displayed contains the Ticket ID, Ticket Name, Organization, Asset, Status, and Last Updated Time.

Verify that the Assets Needs Attention widget displays assets requiring immediate attention.

Verify that each asset displayed contains the Asset ID, Asset Name, Organization, Location, Asset Status, and Last Updated Time.

Verify that the New Tickets widget displays the latest tickets assigned to the logged-in user.

Verify that the newest ticket appears at the top of the list.

Verify that the Notifications widget displays notifications ordered from newest to oldest.

Verify that each notification displays its severity icon, notification message, and timestamp.

Verify that only data the logged-in user has permission to access is displayed.

Verify that the dashboard refreshes automatically whenever ticket, asset, or notification information changes.}
- **Feature code:** ${input:feature:DASHBOARD}

## Before you start: refresh auth

The app requires login and tests reuse a saved session in `auth.json` (JWTs that expire).
Run the setup project first so the MCP browser session is authenticated:

```
npm run auth   # == npx playwright test --project=setup
```

The MCP server is configured in `.vscode/mcp.json` to launch Chrome with
`--storage-state auth.json`. **Ordering matters:** the server reads `auth.json` only
once, at launch. So the sequence must be:

1. `npm run auth` to refresh `auth.json`.
2. **Then** start or restart the `playwright` MCP server
   (Command Palette → "MCP: List Servers" → Restart) so it picks up the fresh session.
3. If a browser snapshot shows the `/login` page, the session is stale — repeat steps 1–2.

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
