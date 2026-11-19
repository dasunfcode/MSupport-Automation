import { Page, Locator, expect } from '@playwright/test';
import { InstallationReportDialog } from './InstallationReportDialog';

const DEFAULT_TIMEOUT = 15_000;
const D = 'commissioning-dialog-commissioning_checklist';
const C = 'commissioning-card-commissioning_checklist';

const API = {
    draft: /\/commissioning\/commissioning_checklist\/draft$/,
    complete: /\/commissioning\/commissioning_checklist\/complete$/,
};

// ---- Template (served by the API, the source of truth for the online form) ----

export type TemplateBlock = {
    key: string;
    type: 'check_item' | 'info';
    label: { en: string };
    links?: { url: string; label: { en: string } }[];
};
export type TemplateSection = { key: string; title: { en: string }; blocks: TemplateBlock[] };
export type ChecklistTemplate = { version: number; sections: TemplateSection[] };

/** A template line is a paragraph; notes / warnings carry a `[!NOTE]` / `[!WARNING]` prefix. */
export type TemplateLine = { text: string; bold: boolean; marker: boolean };

/** Split a template label (markdown-ish) into the lines the form renders. */
export function templateLines(label: string): TemplateLine[] {
    return label.split(/\n{2,}/).map(raw => {
        const marker = /^\[!(NOTE|WARNING)\]/.test(raw);
        const body = raw.replace(/^\[!(NOTE|WARNING)\]\s*/, '').replace(/<[^>]+>/g, '').trim();
        return { text: body.replace(/\*\*/g, '').trim(), bold: /^\*\*.*\*\*$/.test(body), marker };
    });
}

export const tickable = (s: TemplateSection) => s.blocks.filter(b => b.type === 'check_item');

export type ChecklistState = {
    status: 'missing' | 'draft' | 'on_file';
    source: 'online' | 'upload' | null;
    files: { fileId: string; name: string }[];
    progress: { done: number; notApplicable: number; total: number } | null;
    version: number | null;
    previousVersions: { version: number; source: string; files: unknown[] }[];
};

/**
 * Commissioning Checklist: the box on Asset Management → Asset Info →
 * Documents, and the online form opened from it ("Fill out online").
 *
 * Reuses `InstallationReportDialog` for the side panel (opening the asset,
 * Machine setup strip, toasts).
 */
export class CommissioningChecklistDialog {
    readonly report: InstallationReportDialog;

    // ---- Commissioning Checklist box --------------------------------------
    readonly card: Locator;
    readonly cardTag: Locator;
    readonly cardDescription: Locator;
    readonly fillOutOnlineButton: Locator;   // "Fill out online" / "Continue checklist" / "View"
    readonly uploadScanButton: Locator;      // "Upload scan or photos" / "Replace with scan or photos"
    readonly discardDraftButton: Locator;
    readonly deleteButton: Locator;
    readonly fileRows: Locator;
    readonly previousVersionsToggle: Locator;
    readonly previousVersions: Locator;

    // ---- Online form -------------------------------------------------------
    readonly dialog: Locator;
    readonly title: Locator;
    readonly subtitle: Locator;
    readonly note: Locator;
    readonly progress: Locator;
    readonly progressDone: Locator;
    readonly progressNotApplicable: Locator;
    readonly progressBar: Locator;
    readonly saveAndCloseButton: Locator;
    readonly completeButton: Locator;
    readonly completeHint: Locator;
    readonly closeButton: Locator;

    // ---- Confirmations -------------------------------------------------------
    readonly discardDialog: Locator;
    readonly discardAndCloseButton: Locator;
    readonly deleteDialog: Locator;

    constructor(readonly page: Page) {
        this.report = new InstallationReportDialog(page);
        const panel = this.report.sidePanel;

        this.card = panel.getByTestId(C);
        this.cardTag = this.card.locator('h3 + span');
        this.cardDescription = this.card.getByTestId(`${C}-description`);
        this.fillOutOnlineButton = this.card.getByTestId(`${C}-open`);
        this.uploadScanButton = this.card.getByTestId(`${C}-upload-scan`);
        this.discardDraftButton = this.card.getByTestId(`${C}-discard-draft`);
        this.deleteButton = this.card.getByTestId(`${C}-delete`);
        this.fileRows = this.card.getByTestId(`${C}-files`).getByRole('listitem');
        this.previousVersionsToggle = this.card.getByTestId(`${C}-versions-toggle`);
        this.previousVersions = this.card.getByTestId(`${C}-versions`);

        this.dialog = page.getByTestId(D);
        this.title = this.dialog.getByRole('heading', { name: 'Commissioning Checklist', level: 2 });
        this.subtitle = this.title.locator('xpath=following-sibling::p[1]');
        this.note = this.dialog.getByTestId(`${D}-note`);
        this.progress = this.dialog.getByTestId(`${D}-progress`);
        this.progressDone = this.dialog.getByTestId(`${D}-progress-done`);
        this.progressNotApplicable = this.dialog.getByTestId(`${D}-progress-not-applicable`);
        this.progressBar = this.progress.getByRole('progressbar');
        this.saveAndCloseButton = this.dialog.getByTestId(`${D}-save-draft`);
        this.completeButton = this.dialog.getByTestId(`${D}-complete`);
        this.completeHint = this.dialog.locator(`#${D}-complete-hint`);
        this.closeButton = this.dialog.getByRole('button', { name: 'Close' }).last();

        this.discardDialog = page.getByRole('dialog', { name: 'Discard unsaved changes?' });
        this.discardAndCloseButton = this.discardDialog.getByRole('button', { name: 'Discard and close' });
        this.deleteDialog = page.getByRole('dialog', { name: 'Delete the commissioning checklist?' });
    }

    // ======================================================================
    // Locator helpers
    // ======================================================================

    section(key: string) {
        return this.dialog.getByTestId(`commissioning-section-${key}`);
    }

    sectionToggle(key: string) {
        return this.dialog.getByTestId(`commissioning-section-${key}-toggle`);
    }

    sectionCounter(key: string) {
        return this.sectionToggle(key).locator('span').last();
    }

    pointRow(section: string, key: string) {
        return this.dialog.getByTestId(`commissioning-check-${section}-${key}`);
    }

    pointCheckbox(section: string, key: string) {
        return this.dialog.getByTestId(`commissioning-check-${section}-${key}-checkbox`);
    }

    pointNotApplicable(section: string, key: string) {
        return this.dialog.getByTestId(`commissioning-check-${section}-${key}-not-applicable`);
    }

    infoBlock(section: string, key: string) {
        return this.dialog.getByTestId(`commissioning-info-${section}-${key}`);
    }

    // ======================================================================
    // Navigation
    // ======================================================================

    get assetId() {
        return this.report.assetId;
    }

    async openAssetDocuments(serial: string) {
        await this.report.openAssetDocuments(serial);
        await expect(this.card).toBeVisible({ timeout: DEFAULT_TIMEOUT });
    }

    /** Click "Fill out online" / "Continue checklist" / "View" in the box. */
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
    // API (same cookie session as the browser): state, template, cleanup, log
    // ======================================================================

    private commissioningUrl(suffix = '') {
        if (!this.assetId) throw new Error('Open the asset first so its id is known');
        return `/api/v1/assets/${this.assetId}/commissioning${suffix}`;
    }

    async checklistState(): Promise<ChecklistState> {
        const res = await this.page.request.get(this.commissioningUrl());
        expect(res.ok(), `GET commissioning failed: ${res.status()}`).toBeTruthy();
        return (await res.json()).data.find((f: { formType: string }) => f.formType === 'commissioning_checklist');
    }

    /** Template, saved form and prefill (serial / end customer) behind the online form. */
    async checklistForm(): Promise<{ template: ChecklistTemplate; form: any; prefill: { assetSerialNumber: string; companyName: string } }> {
        const res = await this.page.request.get(this.commissioningUrl('/commissioning_checklist'));
        expect(res.ok(), `GET commissioning checklist failed: ${res.status()}`).toBeTruthy();
        return (await res.json()).data;
    }

    async template(): Promise<ChecklistTemplate> {
        return (await this.checklistForm()).template;
    }

    /** Put the asset back to "no commissioning checklist" (draft, filed checklist and versions removed). */
    async resetChecklist(serial: string) {
        await this.openAssetDocuments(serial);
        for (let attempt = 0; attempt < 5; attempt++) {
            const state = await this.checklistState();
            if (state.status === 'missing' && !state.files.length && !state.previousVersions.length) break;
            const target = this.commissioningUrl(state.status === 'draft' ? '/commissioning_checklist/draft' : '/commissioning_checklist');
            const res = await this.page.request.delete(target);
            expect(res.ok(), `DELETE ${target} failed: ${res.status()} ${await res.text()}`).toBeTruthy();
        }
        const final = await this.checklistState();
        expect(final.status, 'Commissioning checklist should be reset to missing').toBe('missing');
        expect(final.files, 'No checklist files should remain').toHaveLength(0);
        expect(final.previousVersions, 'No previous versions should remain').toHaveLength(0);
    }

    /** Asset log entries (Logs → Assets) for this serial since `since` (ISO time), newest first. */
    async assetLog(serial: string, since: string): Promise<{ actionType: string; description: string }[]> {
        const res = await this.page.request.post('/api/v1/logs/search', {
            data: { filters: { resourceType: 'assets' }, sortOrder: 'desc', sortBy: 'createdAt', offset: 0, limit: 50 },
        });
        expect(res.ok(), `POST logs/search failed: ${res.status()}`).toBeTruthy();
        return (await res.json()).data.filter((l: any) => l.targetAssetSerialNumber === serial && l.createdAt >= since);
    }

    async expectLogged(serial: string, since: string, actionType: string) {
        await expect.poll(async () => (await this.assetLog(serial, since)).map(l => l.actionType),
            { message: `Asset log should contain ${actionType}`, timeout: DEFAULT_TIMEOUT }).toContain(actionType);
    }

    // ======================================================================
    // Actions
    // ======================================================================

    async expandSection(key: string) {
        const toggle = this.sectionToggle(key);
        if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    }

    async collapseSection(key: string) {
        const toggle = this.sectionToggle(key);
        if ((await toggle.getAttribute('aria-expanded')) === 'true') await toggle.click();
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    }

    async expandAll(template: ChecklistTemplate) {
        for (const s of template.sections) await this.expandSection(s.key);
    }

    /** Tick / untick a point. The native input is styled away, so its sibling box is clicked. */
    async setPoint(section: string, key: string, checked: boolean) {
        const box = this.pointCheckbox(section, key);
        if ((await box.isChecked()) !== checked) await box.locator('xpath=following-sibling::div[1]').click();
        await expect(box).toBeChecked({ checked });
    }

    async setNotApplicable(section: string, key: string, on: boolean) {
        const button = this.pointNotApplicable(section, key);
        if (((await button.getAttribute('aria-pressed')) === 'true') !== on) await button.click();
        await expect(button).toHaveAttribute('aria-pressed', String(on));
    }

    /**
     * Resolve every tickable point: points listed in `notApplicable`
     * (as "section.key") are marked N/A, every other point is ticked.
     * `skip` (as "section.key") is left untouched.
     */
    async resolveAllPoints(template: ChecklistTemplate, notApplicable: string[] = [], skip: string[] = []) {
        await this.expandAll(template);
        for (const s of template.sections) {
            for (const b of tickable(s)) {
                const id = `${s.key}.${b.key}`;
                if (skip.includes(id)) continue;
                if (notApplicable.includes(id)) await this.setNotApplicable(s.key, b.key, true);
                else await this.setPoint(s.key, b.key, true);
            }
        }
    }

    async saveAndClose() {
        const response = this.page.waitForResponse(r => API.draft.test(r.url()) && r.request().method() === 'PUT');
        await this.saveAndCloseButton.click();
        expect((await response).ok(), 'Save and close request should succeed').toBeTruthy();
        await expect(this.dialog).toBeHidden({ timeout: DEFAULT_TIMEOUT });
    }

    async completeChecklist() {
        await expect(this.completeButton).toBeEnabled({ timeout: DEFAULT_TIMEOUT });
        const response = this.page.waitForResponse(r => API.complete.test(r.url()) && r.request().method() === 'POST');
        await this.completeButton.click();
        expect((await response).ok(), 'Complete checklist request should succeed').toBeTruthy();
        await expect(this.dialog).toBeHidden({ timeout: DEFAULT_TIMEOUT });
    }

    async closeWithX() {
        await this.closeButton.click();
    }

    async discardChanges() {
        await expect(this.discardDialog).toBeVisible();
        await this.discardAndCloseButton.click();
        await expect(this.dialog).toBeHidden();
    }

    /** Delete the filed checklist (box action or file-row action) and confirm. */
    async deleteChecklist(trigger: Locator) {
        await trigger.click();
        await expect(this.deleteDialog).toBeVisible();
        await expect(this.deleteDialog).toContainText('The checklist, its file and its earlier versions are deleted permanently. The machine setup is not affected.');
        const response = this.page.waitForResponse(r => /\/commissioning\/commissioning_checklist$/.test(r.url()) && r.request().method() === 'DELETE');
        await this.deleteDialog.getByRole('button', { name: 'Delete', exact: true }).click();
        expect((await response).ok(), 'Delete request should succeed').toBeTruthy();
        await expect(this.deleteDialog).toBeHidden();
    }

    fileRow(fileName: string) {
        return this.fileRows.filter({ hasText: fileName });
    }

    // ======================================================================
    // Assertions
    // ======================================================================

    async expectTag(tag: 'Not provided' | 'Draft' | 'On file') {
        await expect(this.cardTag).toHaveText(tag);
    }

    /** No checklist yet: the box offers both routes. */
    async expectNotProvided() {
        await this.expectTag('Not provided');
        await expect(this.card).toContainText('Optional');
        await expect(this.fillOutOnlineButton).toHaveText(/Fill out online/);
        await expect(this.uploadScanButton).toHaveText(/Upload scan or photos/);
        await expect(this.cardDescription).toContainText('The checklist is optional and does not complete the machine setup.');
    }

    async expectHeader(serial: string, machineType: string, endCustomer: string) {
        await expect(this.title).toHaveText('Commissioning Checklist');
        const parts = (await this.subtitle.innerText()).split('·').map(s => s.trim());
        expect(parts, 'Header: <serial> · <machine type> · <end customer>').toEqual([serial, machineType, endCustomer]);
    }

    async expectOptionalNote() {
        await expect(this.note).toBeVisible();
        await expect(this.note).toContainText('The checklist is optional and does not complete the machine setup on its own.');
    }

    /** Sections in template order, with their titles and "done / tickable" counters. */
    async expectSectionsFollowTemplate(template: ChecklistTemplate) {
        const toggles = this.dialog.locator('section[data-testid^="commissioning-section-"] > button');
        await expect(toggles).toHaveCount(template.sections.length);
        for (const [i, s] of template.sections.entries()) {
            await expect(this.dialog.locator('section[data-testid^="commissioning-section-"]').nth(i))
                .toHaveAttribute('data-testid', `commissioning-section-${s.key}`);
            await expect(this.sectionToggle(s.key)).toContainText(s.title.en);
        }
    }

    async expectSectionCounter(key: string, done: number, total: number) {
        await expect(this.sectionCounter(key)).toHaveText(`${done} / ${total}`);
    }

    /** Points of a section, in template order, each rendered line by line as in the paper checklist. */
    async expectPointsFollowTemplate(section: TemplateSection) {
        await this.expandSection(section.key);
        const boxes = this.section(section.key).locator('input[type=checkbox]');
        await expect(boxes).toHaveCount(tickable(section).length);
        for (const [i, b] of tickable(section).entries()) {
            const lines = templateLines(b.label.en);
            await expect(boxes.nth(i)).toHaveAttribute('data-testid', `commissioning-check-${section.key}-${b.key}-checkbox`);
            await expect(boxes.nth(i)).toHaveAttribute('aria-label', lines.map(l => l.text).join('\n'));
            await expect(this.pointRow(section.key, b.key).locator('p')).toHaveText(lines.map(l => l.text));
        }
    }

    /** Bold lines of the template (e.g. "MPRINT: …") are rendered bold. */
    async expectBoldLines(section: string, block: TemplateBlock) {
        const paragraphs = this.pointRow(section, block.key).locator('p');
        const lines = templateLines(block.label.en);
        for (const [i, l] of lines.entries()) {
            if (l.bold) await expect(paragraphs.nth(i).locator('strong'), `"${l.text}" should be bold`).toHaveText(l.text);
        }
    }

    /** Sub-lines sit beneath the point text, in their own paragraph; notes and warnings carry a marker icon. */
    async expectSubLines(section: string, block: TemplateBlock) {
        const paragraphs = this.pointRow(section, block.key).locator('p');
        const lines = templateLines(block.label.en);
        expect(lines.length, `${block.key} should have sub-lines`).toBeGreaterThan(1);
        await expect(paragraphs).toHaveCount(lines.length);
        const first = await paragraphs.first().boundingBox();
        for (const [i, l] of lines.entries()) {
            await expect(paragraphs.nth(i)).toHaveText(l.text);
            await expect(paragraphs.nth(i).locator('svg')).toHaveCount(l.marker ? 1 : 0);
            if (i > 0) expect((await paragraphs.nth(i).boundingBox())!.y, `"${l.text}" should be beneath the point text`).toBeGreaterThan(first!.y);
        }
    }

    /** Information notes / warnings: own marker, no checkbox, no N/A. */
    async expectInfoBlock(section: string, block: TemplateBlock) {
        await this.expandSection(section);
        const info = this.infoBlock(section, block.key);
        await expect(info).toBeVisible();
        await expect(info).toContainText(templateLines(block.label.en)[0].text);
        await expect(info.locator('svg'), 'Note should have its own marker').toHaveCount(1);
        await expect(info.getByRole('checkbox')).toHaveCount(0);
        await expect(info.getByRole('button', { name: 'N/A' })).toHaveCount(0);
    }

    async expectProgress(done: number, total: number, notApplicable: number) {
        await expect(this.progressDone).toHaveText(`${done} of ${total} points done`);
        await expect(this.progressNotApplicable).toHaveText(`${notApplicable} not applicable`);
        // The bar reads "x of y points done" and fills with every resolved point (ticked or n/a).
        await expect(this.progressBar).toHaveAccessibleName(`${done} of ${total} points done`);
        await expect(this.progressBar).toHaveAttribute('aria-valuenow', String(done + notApplicable));
        await expect(this.progressBar).toHaveAttribute('aria-valuemax', String(total));
    }

    async expectCompleteDisabled() {
        await expect(this.completeButton).toBeDisabled();
        await expect(this.completeHint).toHaveText('Tick every point or mark it as not applicable to complete the checklist');
    }

    async expectCompleteEnabled() {
        await expect(this.completeButton).toBeEnabled({ timeout: DEFAULT_TIMEOUT });
    }

    async expectDraft(done: number, total: number, notApplicable: number) {
        await this.expectTag('Draft');
        await expect(this.cardDescription).toContainText(`${done} of ${total} points done · ${notApplicable} not applicable.`);
        await expect(this.fillOutOnlineButton).toHaveText(/Continue checklist/);
        await expect(this.discardDraftButton).toBeVisible();
    }

    /** Completed online: On file, completion line, "View" instead of "Fill out online". */
    async expectCompletedOnline() {
        await this.expectTag('On file');
        await expect(this.cardDescription).toContainText(/Completed on .+ by /);
        await expect(this.fillOutOnlineButton).toHaveText(/View/);
        await expect(this.uploadScanButton).toHaveText(/Replace with scan or photos/);
    }

    /** View mode of a completed checklist: nothing can be changed. */
    async expectReadOnly(template: ChecklistTemplate) {
        await expect(this.dialog).toContainText(/Completed on .+ by /);
        await expect(this.saveAndCloseButton).toHaveCount(0);
        await expect(this.completeButton).toHaveCount(0);
        await this.expandAll(template);
        for (const s of template.sections) {
            for (const b of tickable(s)) {
                await expect(this.pointCheckbox(s.key, b.key)).toBeDisabled();
                await expect(this.pointNotApplicable(s.key, b.key)).toBeDisabled();
            }
        }
    }

    /** A filed checklist's file row, with download and delete actions. */
    async expectFileRow(fileName: string) {
        const row = this.fileRow(fileName);
        await expect(row).toHaveCount(1);
        await expect(row.getByRole('button', { name: `Download ${fileName}` })).toBeVisible();
        await expect(row.getByRole('button', { name: `Delete ${fileName}` })).toBeVisible();
    }

    async setupProgress() {
        return this.report.setupProgress();
    }
}
