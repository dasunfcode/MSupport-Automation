import { Page, Locator, Request, expect } from '@playwright/test';

const DEFAULT_TIMEOUT = 15_000;
// Uploading and filing go through QA file storage; the server alone has taken 30 s+ to answer.
const STORAGE_RESPONSE_TIMEOUT = 90_000;

// ---- Template content (paper form 2024_01_Installation_Report_OCM) ----------

export const CUSTOMER_FIELDS = [
    { key: 'company_name', label: 'Company Name', fromRecord: true },
    { key: 'address', label: 'Address', fromRecord: true },
    { key: 'contact_person', label: 'Contact Person', fromRecord: false },
    { key: 'phone', label: 'Phone', fromRecord: true },
    { key: 'email', label: 'E-mail', fromRecord: true },
] as const;
export type CustomerFieldKey = typeof CUSTOMER_FIELDS[number]['key'];

export const COMPONENTS = [
    { key: 'mprint', label: 'MPRINT' },
    { key: 'mprint_pro', label: 'MPRINT Pro' },
    { key: 'mpure', label: 'MPURE' },
    { key: 'mpure_pro', label: 'MPURE Pro' },
    { key: 'mpure_lite', label: 'MPURE Light' },
    { key: 'standard_module', label: 'Standard Module' },
    { key: 'heating_module', label: 'Heating Module' },
    { key: 'lab_module', label: 'Lab Module' },
    { key: 'extended_module', label: 'Extended Module' },
] as const;
export type ComponentKey = typeof COMPONENTS[number]['key'];

/** Points of section 3, in paper-form order. `parent` marks a sub-point. */
export const INITIAL_OPERATION_POINTS = [
    { key: 'commissioning_by_reseller', label: 'Commissioning was carried out by the Reseller according to the Checklist' },
    { key: 'customer_trained', label: 'Customer was trained on the System' },
    { key: 'help_section_videos_seen', label: 'Help section with Tutorial Videos seen by the customer', parent: 'customer_trained' },
    { key: 'gas_filter_video_seen', label: 'Video "Changing the gas filter" seen by the customer', parent: 'customer_trained' },
    { key: 'depowdering_video_seen', label: 'Video "Depowdering and setup" seen by the customer (not in checklist)', parent: 'customer_trained' },
    { key: 'acceptance_build_job_printed', label: 'Acceptance build job has been printed' },
    { key: 'documents_on_file', label: "The following documents are on the customer's file:" },
    { key: 'wiring_diagram', label: 'Wiring diagram MPRINT & MPUREpro', parent: 'documents_on_file' },
    { key: 'operator_manual', label: 'Operator manual', parent: 'documents_on_file' },
    { key: 'declaration_of_conformity', label: 'Declaration of Conformity', parent: 'documents_on_file' },
    { key: 'neopixel_cheatsheet', label: 'Cheatsheet (Neopixel overview MPUREpro)', parent: 'documents_on_file' },
] as const;
export type PointKey = typeof INITIAL_OPERATION_POINTS[number]['key'];

export type Signer = 'customer' | 'service_engineer';

export type ReportData = {
    address?: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    description?: string;
    customerName?: string;
    customerRole?: string;
    customerPlace?: string;
    engineerPlace?: string;
};

const API = {
    draft: /\/commissioning\/installation_report\/draft$/,
    complete: /\/commissioning\/installation_report\/complete$/,
    signatureRequest: /\/commissioning\/installation_report\/signature-request$/,
};

/**
 * The Installation Report form, opened from Asset Management → Asset Info →
 * Documents → Installation Report box → "Fill out online".
 * The form is fully covered by `commissioning-*` data-testids.
 */
export class InstallationReportDialog {
    // ---- Asset side panel / Documents tab -----------------------------------
    readonly sidePanel: Locator;
    readonly documentsTab: Locator;
    readonly reportCard: Locator;
    readonly fillOutOnlineButton: Locator;
    readonly setupBar: Locator;

    // ---- Form ---------------------------------------------------------------
    readonly dialog: Locator;
    readonly title: Locator;
    readonly subtitle: Locator;
    readonly closeButton: Locator;
    readonly previewButton: Locator;
    readonly backToEditButton: Locator;
    readonly saveDraftButton: Locator;
    readonly completeButton: Locator;
    readonly completeHint: Locator;
    readonly description: Locator;

    // ---- Signatures ---------------------------------------------------------
    readonly customerSignsHere: Locator;
    readonly customerSendEmail: Locator;
    readonly customerName: Locator;
    readonly customerRole: Locator;
    readonly requestBlock: Locator;
    readonly requestName: Locator;
    readonly requestEmail: Locator;
    readonly requestLanguage: Locator;
    readonly requestMessage: Locator;
    readonly sendRequestButton: Locator;
    readonly engineerPrintedName: Locator;

    // ---- Discard confirmation ----------------------------------------------
    readonly discardDialog: Locator;
    readonly discardAndCloseButton: Locator;

    constructor(readonly page: Page) {
        this.sidePanel = page.getByRole('dialog', { name: 'Side panel' });
        this.documentsTab = this.sidePanel.getByTestId('asset-tab-documents');
        this.reportCard = this.sidePanel.getByTestId('commissioning-card-installation_report');
        this.fillOutOnlineButton = this.sidePanel.getByTestId('commissioning-card-installation_report-open');
        this.setupBar = this.sidePanel.getByTestId('machine-setup-bar');

        this.dialog = page.getByTestId('commissioning-dialog-installation_report');
        this.title = this.dialog.getByRole('heading', { name: 'Installation Report', level: 2 });
        this.subtitle = this.title.locator('xpath=following-sibling::p[1]');
        this.closeButton = this.dialog.getByRole('button', { name: 'Close' }).last();
        this.previewButton = this.dialog.getByTestId('commissioning-dialog-installation_report-preview');
        this.backToEditButton = this.dialog.getByRole('button', { name: 'Back to edit' });
        this.saveDraftButton = this.dialog.getByTestId('commissioning-dialog-installation_report-save-draft');
        this.completeButton = this.dialog.getByTestId('commissioning-dialog-installation_report-complete');
        this.completeHint = this.dialog.locator('#commissioning-dialog-installation_report-complete-hint');
        this.description = this.dialog.getByTestId('commissioning-field-initial_operation-description').getByRole('textbox');

        this.customerSignsHere = this.dialog.getByTestId('commissioning-signature-customer-signs-here');
        this.customerSendEmail = this.dialog.getByTestId('commissioning-signature-customer-send-email');
        this.customerName = this.dialog.getByTestId('commissioning-signature-customer-name');
        this.customerRole = this.dialog.getByTestId('commissioning-signature-customer-role');
        this.requestBlock = this.dialog.getByTestId('commissioning-signature-customer-request');
        this.requestName = this.dialog.getByTestId('commissioning-signature-customer-request-name');
        this.requestEmail = this.dialog.getByTestId('commissioning-signature-customer-request-email');
        this.requestLanguage = this.dialog.getByTestId('commissioning-signature-customer-request-language');
        this.requestMessage = this.dialog.getByTestId('commissioning-signature-customer-request-message');
        this.sendRequestButton = this.dialog.getByTestId('commissioning-signature-customer-request-send');
        this.engineerPrintedName = this.dialog.getByTestId('commissioning-signature-service_engineer-printed-name');

        this.discardDialog = page.getByRole('dialog', { name: 'Discard unsaved changes?' });
        this.discardAndCloseButton = this.discardDialog.getByRole('button', { name: 'Discard and close' });
    }

    // ======================================================================
    // Locator helpers
    // ======================================================================

    section(key: 'customer_information' | 'components' | 'initial_operation' | 'signatures') {
        return this.dialog.getByTestId(`commissioning-section-${key}`);
    }

    customerFieldContainer(key: CustomerFieldKey) {
        return this.dialog.getByTestId(`commissioning-field-customer_information-${key}`);
    }

    customerField(key: CustomerFieldKey) {
        return this.customerFieldContainer(key).getByRole('textbox');
    }

    componentCheckbox(key: ComponentKey) {
        return this.dialog.getByTestId(`commissioning-component-components-${key}-checkbox`);
    }

    componentSerial(key: ComponentKey) {
        return this.dialog.getByTestId(`commissioning-component-components-${key}-input`);
    }

    pointRow(key: PointKey) {
        return this.dialog.getByTestId(`commissioning-check-initial_operation-${key}`);
    }

    pointCheckbox(key: PointKey) {
        return this.dialog.getByTestId(`commissioning-check-initial_operation-${key}-checkbox`);
    }

    signatureBlock(who: Signer) {
        return this.dialog.getByTestId(`commissioning-signature-${who}`);
    }

    signatureDate(who: Signer) {
        return this.dialog.getByTestId(`commissioning-signature-${who}-date`).getByRole('textbox');
    }

    signaturePlace(who: Signer) {
        return this.dialog.getByTestId(`commissioning-signature-${who}-place`);
    }

    signaturePad(who: Signer) {
        return this.dialog.getByTestId(`commissioning-signature-${who}-pad`).locator('canvas');
    }

    signatureClear(who: Signer) {
        return this.dialog.getByTestId(`commissioning-signature-${who}-clear`);
    }

    setupStep(key: 'installation_report' | 'installation_date' | 'end_customer') {
        return this.sidePanel.getByTestId(`machine-setup-step-${key}`);
    }

    // ======================================================================
    // Navigation
    // ======================================================================

    /** Asset UUID, captured from the commissioning request when the asset is opened. */
    assetId = '';

    /** Open the Asset Info side panel of the asset with this serial, on the Documents tab. */
    async openAssetDocuments(serial: string) {
        await this.page.goto('/assets');
        await this.page.waitForLoadState('networkidle', { timeout: 20_000 });
        await this.page.getByRole('textbox', { name: 'Search...' }).fill(serial);
        const row = this.page.getByRole('row').filter({ hasText: serial }).first();
        await row.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });

        const commissioning = this.page.waitForResponse(r => /\/api\/v1\/assets\/[^/]+\/commissioning$/.test(r.url()));
        await row.getByRole('button', { name: 'Asset Info' }).click();
        await this.sidePanel.waitFor({ state: 'visible', timeout: DEFAULT_TIMEOUT });
        await this.documentsTab.click();
        this.assetId = (await commissioning).url().match(/\/assets\/([^/]+)\/commissioning$/)![1];
        await expect(this.reportCard).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    }

    // ======================================================================
    // Cleanup (API, same cookie session as the browser)
    // ======================================================================

    private commissioningUrl(suffix = '') {
        if (!this.assetId) throw new Error('Open the asset first so its id is known');
        return `/api/v1/assets/${this.assetId}/commissioning${suffix}`;
    }

    /** Current server-side state of the Installation Report form. */
    async reportState(): Promise<{ status: string; files: unknown[]; previousVersions: unknown[]; signatureRequest: unknown }> {
        const res = await this.page.request.get(this.commissioningUrl());
        expect(res.ok(), `GET commissioning failed: ${res.status()}`).toBeTruthy();
        const forms: any[] = (await res.json()).data;
        return forms.find(f => f.formType === 'installation_report');
    }

    /**
     * Put the asset back to "no installation report": discard any draft or
     * pending signature request, and delete the filed report together with its
     * files, signatures and previous versions. Loops because deleting the
     * current version can surface a previous one.
     */
    async resetReport(serial: string) {
        await this.openAssetDocuments(serial);
        for (let attempt = 0; attempt < 5; attempt++) {
            const state = await this.reportState();
            if (state.status === 'missing' && !state.files.length && !state.previousVersions.length) break;

            const target = state.status === 'draft'
                ? this.commissioningUrl('/installation_report/draft')
                : this.commissioningUrl('/installation_report');
            const res = await this.page.request.delete(target);
            expect(res.ok(), `DELETE ${target} failed: ${res.status()} ${await res.text()}`).toBeTruthy();
        }
        const final = await this.reportState();
        expect(final.status, 'Installation report should be reset to missing').toBe('missing');
        expect(final.files, 'No report files should remain').toHaveLength(0);
        expect(final.previousVersions, 'No previous versions should remain').toHaveLength(0);
        expect(final.signatureRequest, 'No signature request should remain').toBeNull();
    }

    async openForm() {
        await this.fillOutOnlineButton.click();
        await expect(this.dialog).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        await expect(this.title).toBeVisible();
    }

    async openFormForAsset(serial: string) {
        await this.openAssetDocuments(serial);
        await this.openForm();
    }

    // ======================================================================
    // Actions
    // ======================================================================

    async fillCustomerField(key: CustomerFieldKey, value: string) {
        await this.customerField(key).fill(value);
    }

    async setComponent(key: ComponentKey, checked: boolean, serial?: string) {
        const box = this.componentCheckbox(key);
        if ((await box.isChecked()) !== checked) {
            // The input sits inside a <label>, so clicking the visual box toggles it.
            await box.locator('xpath=following-sibling::div[1]').click();
        }
        await expect(box).toBeChecked({ checked });
        if (checked && serial !== undefined) await this.componentSerial(key).fill(serial);
    }

    /**
     * Toggle a section-3 point. The native input is `sr-only`, so the styled
     * sibling box is clicked. Parent points toggle their sub-points too, so the
     * click only happens when the state actually differs.
     */
    async setPoint(key: PointKey, checked: boolean) {
        const box = this.pointCheckbox(key);
        if ((await box.isChecked()) !== checked) {
            await box.locator('xpath=following-sibling::div[1]').click();
        }
        await expect(box).toBeChecked({ checked });
    }

    async tickAllPoints() {
        for (const p of INITIAL_OPERATION_POINTS) await this.setPoint(p.key, true);
        for (const p of INITIAL_OPERATION_POINTS) await expect(this.pointCheckbox(p.key)).toBeChecked();
    }

    /**
     * Draw a signature on the canvas pad with real mouse strokes. The pad
     * listens to pointer events (touch-none canvas), so a zig-zag drag through
     * page.mouse is captured exactly as a user's stroke would be.
     */
    async drawSignature(who: Signer) {
        const pad = this.signaturePad(who);
        // Centre the pad: the sticky dialog footer would otherwise cover it and swallow the stroke.
        await pad.evaluate(el => el.scrollIntoView({ block: 'center' }));
        const box = await pad.boundingBox();
        if (!box) throw new Error(`Signature pad for ${who} is not visible`);

        const y = box.y + box.height / 2;
        await this.page.mouse.move(box.x + 20, y);
        await this.page.mouse.down();
        for (let i = 1; i <= 10; i++) {
            await this.page.mouse.move(box.x + 20 + i * 18, y + (i % 2 ? 18 : -18), { steps: 4 });
        }
        await this.page.mouse.up();
        await this.expectSignatureDrawn(who);
    }

    async clearSignature(who: Signer) {
        await this.signatureClear(who).click();
        await this.expectSignatureEmpty(who);
    }

    /** Number of painted pixels on a signature canvas. */
    async inkedPixels(who: Signer): Promise<number> {
        return this.signaturePad(who).evaluate((c: HTMLCanvasElement) => {
            const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
            let n = 0;
            for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) n++;
            return n;
        });
    }

    async fillCustomerInformation(data: ReportData) {
        if (data.address !== undefined) await this.fillCustomerField('address', data.address);
        if (data.contactPerson !== undefined) await this.fillCustomerField('contact_person', data.contactPerson);
        if (data.phone !== undefined) await this.fillCustomerField('phone', data.phone);
        if (data.email !== undefined) await this.fillCustomerField('email', data.email);
    }

    /** Fill everything needed for filing with "Customer signs here". */
    async fillCompleteReport(data: ReportData, component?: { key: ComponentKey; serial: string }) {
        await this.fillCustomerInformation(data);
        // Organization records may lack phone / e-mail: fill by hand if empty.
        if (!(await this.customerField('phone').inputValue())) await this.fillCustomerField('phone', '+94 110000000');
        if (!(await this.customerField('email').inputValue())) await this.fillCustomerField('email', 'customer@example.com');
        if (!(await this.customerField('address').inputValue())) await this.fillCustomerField('address', data.address ?? 'Main Street 1');

        if (component) await this.setComponent(component.key, true, component.serial);
        await this.tickAllPoints();
        if (data.description !== undefined) await this.description.fill(data.description);

        await this.customerSignsHere.click();
        await this.customerName.fill(data.customerName ?? 'Customer');
        if (data.customerRole !== undefined) await this.customerRole.fill(data.customerRole);
        await this.signaturePlace('customer').fill(data.customerPlace ?? 'Colombo');
        await this.drawSignature('customer');

        await this.signaturePlace('service_engineer').fill(data.engineerPlace ?? 'Colombo');
        await this.drawSignature('service_engineer');
    }

    async chooseSendByEmail() {
        await this.customerSendEmail.click();
        await expect(this.customerSendEmail).toHaveAttribute('aria-pressed', 'true');
        await expect(this.requestBlock).toBeVisible();
    }

    async chooseSignsHere() {
        await this.customerSignsHere.click();
        await expect(this.customerSignsHere).toHaveAttribute('aria-pressed', 'true');
    }

    async fillSignatureRequest(name: string, email: string, language?: 'English' | 'German', message?: string) {
        await this.requestName.fill(name);
        await this.requestEmail.fill(email);
        if (language) {
            await this.requestLanguage.click();
            await this.page.getByRole('option', { name: language, exact: true }).click();
            await expect(this.requestLanguage).toContainText(language);
        }
        if (message !== undefined) await this.requestMessage.fill(message);
    }

    /** "Try to file": the button is aria-disabled, so a forced click reveals the validation. */
    async tryToFile() {
        await this.completeButton.click({ force: true });
    }

    async openPreview() {
        await this.previewButton.click();
        await expect(this.backToEditButton).toBeVisible();
    }

    async backToEdit() {
        await this.backToEditButton.click();
        await expect(this.previewButton).toHaveText('Preview');
    }

    async saveDraft() {
        const response = this.page.waitForResponse(r => API.draft.test(r.url()) && r.request().method() === 'PUT');
        await this.saveDraftButton.click();
        expect((await response).ok(), 'Save draft request should succeed').toBeTruthy();
        await expect(this.dialog).toBeHidden({ timeout: DEFAULT_TIMEOUT });
    }

    async fileReport() {
        await expect(this.completeButton).toBeEnabled({ timeout: DEFAULT_TIMEOUT });
        const response = this.page.waitForResponse(r => API.complete.test(r.url()) && r.request().method() === 'POST', { timeout: STORAGE_RESPONSE_TIMEOUT });
        await this.completeButton.click();
        expect((await response).ok(), 'Complete and file request should succeed').toBeTruthy();
        await expect(this.dialog).toBeHidden({ timeout: DEFAULT_TIMEOUT });
    }

    /**
     * Click `button` and wait until the POST to `endpoint` is sent. Filing and
     * Send Request first upload the report PDF to file storage, which can take a
     * while on QA, so a toast or other result only shows up after that.
     */
    async clickAndAwaitRequest(button: Locator, endpoint: keyof typeof API) {
        const sent = this.page.waitForRequest(r => API[endpoint].test(r.url()) && r.method() === 'POST', { timeout: STORAGE_RESPONSE_TIMEOUT });
        await button.click();
        await sent;
    }

    async sendSignatureRequest() {
        await this.clickAndAwaitRequest(this.sendRequestButton, 'signatureRequest');
    }

    async closeWithX() {
        await this.closeButton.click();
    }

    async discardChanges() {
        await expect(this.discardDialog).toBeVisible();
        await this.discardAndCloseButton.click();
        await expect(this.dialog).toBeHidden();
    }

    /**
     * Intercept the next request to `endpoint` without letting it reach the
     * server, answer it with `status`, and return the captured request.
     * Used for the e-mail flow (no real mail is sent) and failure handling.
     */
    async stubNext(endpoint: keyof typeof API, status = 500, body: object = { message: 'Stubbed failure' }) {
        let captured: Request | undefined;
        await this.page.route(API[endpoint], async route => {
            captured = route.request();
            await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
        }, { times: 1 });
        return () => {
            if (!captured) throw new Error(`No ${endpoint} request was sent`);
            return captured;
        };
    }

    /**
     * Answer every request to `endpoint` with a fake 500 and count them, so a
     * test can prove nothing was sent (and nothing ever reaches the server).
     */
    async blockAndCount(endpoint: keyof typeof API) {
        let count = 0;
        await this.page.route(API[endpoint], async route => {
            count++;
            await route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"Blocked by test"}' });
        });
        return () => count;
    }

    /** Make the next request to `endpoint` time out (network abort). */
    async failNextWithTimeout(endpoint: keyof typeof API) {
        await this.page.route(API[endpoint], route => route.abort('timedout'), { times: 1 });
    }

    // ======================================================================
    // Assertions
    // ======================================================================

    /** Header subtitle split into [serial, machine type, end customer]. */
    async headerParts(): Promise<string[]> {
        return (await this.subtitle.innerText()).split('·').map(s => s.trim()).filter(Boolean);
    }

    async expectHeader(serial: string, machineType: RegExp | string, endCustomer?: string) {
        await expect(this.title).toHaveText('Installation Report');
        await expect(this.subtitle).toContainText(serial);
        await expect(this.subtitle).toContainText(machineType);
        if (endCustomer) await expect(this.subtitle).toContainText(endCustomer);
        // "<serial> · <type> · <end customer>"
        expect((await this.subtitle.innerText()).split('·').map(s => s.trim()).filter(Boolean)).toHaveLength(3);
    }

    async expectSectionsInOrder() {
        const expected = [
            ['1', 'Customer Information'],
            ['2', 'Components'],
            ['3', 'Content of the Initial Operation'],
            ['4', 'Signatures'],
        ];
        const headings = this.dialog.locator('section[data-testid^="commissioning-section-"] h3');
        await expect(headings).toHaveText(expected.map(([, name]) => name));
        for (const [num, name] of expected) {
            const section = this.dialog.locator('section[data-testid^="commissioning-section-"]').filter({
                has: this.page.getByRole('heading', { name, exact: true }),
            });
            await expect(section).toContainText(num);
        }
    }

    async expectCustomerFieldsPrefilled(expectedCompanyName?: string) {
        for (const f of CUSTOMER_FIELDS) {
            const container = this.customerFieldContainer(f.key);
            const value = await this.customerField(f.key).inputValue();
            if (f.fromRecord && value) {
                await expect(container, `${f.label} is pre-filled, so it should be marked as coming from the record`)
                    .toContainText('from record');
            } else {
                // Contact Person, or a record value that is missing (exceptional case: fill by hand).
                await expect(container, `${f.label} has no record value and must not be marked`).not.toContainText('from record');
            }
        }
        await expect(this.customerFieldContainer('company_name')).toContainText('from record');
        if (expectedCompanyName) await expect(this.customerField('company_name')).toHaveValue(expectedCompanyName);
        else await expect(this.customerField('company_name')).not.toHaveValue('');
    }

    async expectContactPersonEmptyAndEditable(value: string) {
        await expect(this.customerField('contact_person')).toHaveValue('');
        await this.fillCustomerField('contact_person', value);
        await expect(this.customerField('contact_person')).toHaveValue(value);
    }

    async expectAllCustomerFieldsEditable() {
        for (const f of CUSTOMER_FIELDS) {
            const field = this.customerField(f.key);
            await expect(field, `${f.label} should be editable`).toBeEditable();
            const original = await field.inputValue();
            await field.fill(`${original} edited`);
            await expect(field).toHaveValue(`${original} edited`);
            await field.fill(original);
        }
    }

    async expectAllCustomerFieldsMandatory() {
        for (const f of CUSTOMER_FIELDS) {
            await expect(this.customerField(f.key)).toHaveAccessibleName(`${f.label} *`);
        }
        // Empty each field and confirm the form reports it on filing.
        const originals: Record<string, string> = {};
        for (const f of CUSTOMER_FIELDS) {
            originals[f.key] = await this.customerField(f.key).inputValue();
            await this.customerField(f.key).fill('');
        }
        await this.tryToFile();
        for (const f of CUSTOMER_FIELDS) {
            await expect(this.customerFieldContainer(f.key), `${f.label} should be reported as required`)
                .toContainText(/required/i);
        }
        await expect(this.completeButton).toBeDisabled();
        for (const f of CUSTOMER_FIELDS) await this.customerField(f.key).fill(originals[f.key]);
    }

    async expectComponentsListed() {
        const labels = this.section('components').getByRole('checkbox');
        await expect(labels).toHaveCount(COMPONENTS.length);
        for (const [i, c] of COMPONENTS.entries()) {
            await expect(labels.nth(i)).toHaveAccessibleName(c.label);
            await expect(this.componentSerial(c.key)).toBeVisible();
            await expect(this.componentSerial(c.key)).toHaveAccessibleName('Serial number');
        }
    }

    async expectSerialOnlyEditableWhenTicked(key: ComponentKey) {
        await this.setComponent(key, false);
        await expect(this.componentSerial(key)).toBeDisabled();
        await this.setComponent(key, true);
        await expect(this.componentSerial(key)).toBeEditable();
        await this.setComponent(key, false);
        await expect(this.componentSerial(key)).toBeDisabled();
    }

    async expectComponentPreTicked(key: ComponentKey, serial: string) {
        await expect(this.componentCheckbox(key)).toBeChecked();
        await expect(this.componentSerial(key)).toHaveValue(serial);
        for (const c of COMPONENTS.filter(c => c.key !== key)) {
            await expect(this.componentCheckbox(c.key)).not.toBeChecked();
        }
    }

    async expectAtLeastOneComponentRequired() {
        const ticked: ComponentKey[] = [];
        for (const c of COMPONENTS) if (await this.componentCheckbox(c.key).isChecked()) ticked.push(c.key);
        for (const key of ticked) await this.setComponent(key, false);

        await this.tryToFile();
        await expect(this.section('components')).toContainText(/at least one|required/i);
        await expect(this.completeButton).toBeDisabled();
    }

    async expectPointsInPaperOrder() {
        const boxes = this.section('initial_operation').getByRole('checkbox');
        await expect(boxes).toHaveCount(INITIAL_OPERATION_POINTS.length);
        for (const [i, p] of INITIAL_OPERATION_POINTS.entries()) {
            await expect(boxes.nth(i)).toHaveAccessibleName(p.label);
            await expect(this.pointRow(p.key)).toContainText(p.label);
            // Sub-points are rendered with a bullet, top-level points are not.
            const bullet = this.dialog.getByTestId(`commissioning-check-initial_operation-${p.key}-bullet`);
            await expect(bullet).toHaveCount('parent' in p ? 1 : 0);
        }
    }

    async expectEveryPointMandatoryWithoutRequiredTag() {
        await expect(this.section('initial_operation')).not.toContainText(/required/i);
        await this.tryToFile();
        for (const p of INITIAL_OPERATION_POINTS) {
            await expect(this.pointRow(p.key), `${p.label} should be flagged`).toContainText('This point must be confirmed');
        }
    }

    async expectDescriptionOptional() {
        const descField = this.dialog.getByTestId('commissioning-field-initial_operation-description');
        await expect(descField).toBeVisible();
        await expect(this.description).toHaveAccessibleName('Description');
        // It is the last item of section 3.
        const lastChild = this.section('initial_operation').locator('[data-testid^="commissioning-"]').last();
        await expect(lastChild).toHaveAttribute('data-testid', /initial_operation-description/);
        await this.tryToFile();
        await expect(descField).not.toContainText(/required/i);
    }

    async expectChecklistHint() {
        const hint = this.section('initial_operation').getByText(/no commissioning checklist/i);
        await expect(hint).toBeVisible();
        await expect(this.section('initial_operation').getByRole('link', { name: /checklist/i })
            .or(this.section('initial_operation').getByRole('button', { name: /checklist/i }))).toBeVisible();
    }

    async expectTwoSignatureBlocks() {
        for (const who of ['customer', 'service_engineer'] as const) {
            await expect(this.signatureBlock(who)).toBeVisible();
            await expect(this.signatureDate(who)).toBeVisible();
            await expect(this.signaturePlace(who)).toBeVisible();
        }
        await expect(this.signatureBlock('customer').getByRole('heading', { level: 4 })).toContainText('Customer');
        await expect(this.signatureBlock('service_engineer').getByRole('heading', { level: 4 })).toContainText('Service Engineer');
    }

    async expectEngineerBlock(engineerName?: string) {
        await expect(this.signaturePad('service_engineer')).toBeVisible();
        await expect(this.signatureClear('service_engineer')).toBeVisible();
        await expect(this.engineerPrintedName).not.toBeEmpty();
        if (engineerName) await expect(this.engineerPrintedName).toContainText(engineerName);
    }

    async expectSignsHereFields() {
        await expect(this.customerSignsHere).toHaveAttribute('aria-pressed', 'true');
        await expect(this.signatureDate('customer')).toBeVisible();
        await expect(this.signaturePlace('customer')).toBeVisible();
        await expect(this.signaturePad('customer')).toBeVisible();
        await expect(this.customerName).toBeVisible();
        await expect(this.customerRole).toBeVisible();
        await expect(this.customerRole).toHaveAttribute('placeholder', /optional/i);
        await expect(this.requestBlock).toBeHidden();
    }

    async expectSendByEmailFields() {
        await expect(this.requestName).toBeVisible();
        await expect(this.requestEmail).toBeVisible();
        await expect(this.requestLanguage).toBeVisible();
        await expect(this.requestMessage).toBeVisible();
        await expect(this.requestMessage).toHaveAttribute('placeholder', /optional/i);
        await expect(this.sendRequestButton).toBeVisible();
        // The on-site fields are replaced by the request fields.
        await expect(this.signaturePad('customer')).toBeHidden();
        await expect(this.customerName).toBeHidden();
    }

    async expectEngineerSignatureRequired() {
        await this.tryToFile();
        const block = this.signatureBlock('service_engineer');
        await expect(block).toContainText('A signature is required');
        await expect(block).toContainText('Place is required');
        await expect(this.signatureDate('service_engineer')).toBeVisible();
    }

    async expectSignatureDrawn(who: Signer) {
        await expect.poll(() => this.inkedPixels(who), { message: `${who} signature should have ink` }).toBeGreaterThan(50);
    }

    async expectSignatureEmpty(who: Signer) {
        await expect.poll(() => this.inkedPixels(who)).toBe(0);
    }

    async expectPreviewIsReadOnly() {
        await expect(this.dialog).toContainText('Preview of the form as it will be filed');
        for (const f of CUSTOMER_FIELDS) await expect(this.customerField(f.key)).toBeDisabled();
        for (const c of COMPONENTS) await expect(this.componentCheckbox(c.key)).toBeDisabled();
        for (const p of INITIAL_OPERATION_POINTS) await expect(this.pointCheckbox(p.key)).toBeDisabled();
        // The Preview button itself toggles into "Back to edit".
        await expect(this.previewButton).toHaveText('Back to edit');
    }

    async expectCompleteDisabled() {
        await expect(this.completeButton).toBeDisabled();
        await expect(this.completeHint).toBeVisible();
    }

    async expectCompleteEnabled() {
        await expect(this.completeButton).toBeEnabled({ timeout: DEFAULT_TIMEOUT });
    }

    async expectToast(text?: string | RegExp) {
        const toast = this.page.locator('[data-sonner-toast]').last();
        await expect(toast).toBeVisible({ timeout: DEFAULT_TIMEOUT });
        if (text) await expect(toast).toContainText(text);
    }

    async expectReportMissing() {
        await expect(this.reportCard).toContainText('Missing');
        await expect(this.fillOutOnlineButton).toHaveText(/Fill out online/);
        await expect(this.setupStep('installation_report')).toContainText('not done yet');
    }

    /** Once filed, the same "-open" button becomes "View"; replacing is only possible with a scan. */
    async expectReportOnFile() {
        await expect(this.reportCard).toContainText('On file');
        await expect(this.reportCard).toContainText(/Completed on .+ by /);
        await expect(this.reportCard.getByRole('button', { name: /Fill out online/ }),
            '"Fill out online" must no longer be offered').toHaveCount(0);
        await expect(this.reportCard.getByRole('button', { name: 'View' })).toBeVisible();
        await expect(this.reportCard.getByRole('button', { name: 'Replace with scan or photos' })).toBeVisible();
        await expect(this.setupStep('installation_report')).not.toContainText('not done yet');
    }

    async setupProgress(): Promise<number> {
        const text = await this.setupBar.innerText();
        const match = text.match(/(\d+)\s+of\s+(\d+)/);
        if (!match) throw new Error(`Machine setup progress not found in: ${text}`);
        return Number(match[1]);
    }
}
