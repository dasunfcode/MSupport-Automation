import { test, expect } from '../fixtures/fixtures';
import { MACHINE_OPTIONS, NewErrorCodeInput } from '../pages/ErrorCodesPage';

const stamp = Date.now();

const newErrorCode: NewErrorCodeInput = {
    machine: 'MPRINT',
    severity: 'Error',
    systemShort: 'ECA',
    subsystem1: `AutoSub1 ${stamp}`,
    subsystem2: `AutoSub2 ${stamp}`,
    description: `AutoDesc ${stamp}`,
    solution: `Auto solution ${stamp}`,
};

// MPR (machine) - ECA (system) - nn (new sub 1) - 01 (new sub 2) - E01 (new error)
const createdCodePattern = /^MPR-ECA-\d{2,}-01-E01$/;
const createdCodeInTextPattern = /MPR-ECA-\d{2,}-01-E01/;

let totalBefore = 0;
let solutionsBefore = 0;

const editedDescription = `AutoDesc edited ${stamp}`;
const addedSolution = `Auto added solution ${stamp}`;
const editedSolution = `Auto edited solution ${stamp}`;
// Tracks the created code's description as the edit tests change it.
let currentDescription = newErrorCode.description;

test.describe.serial('CREATE ERROR CODE - Admin creates a new error code', () => {

    test('MSUP-CREATE-ERROR-CODE-TC001a_Create Error button opens the Create Error Code modal', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.expectDialogOpen();
    });

    test('MSUP-CREATE-ERROR-CODE-TC001b_Modal shows title and close icon', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await expect(errorCodesPage.dialogTitle).toBeVisible();
        await expect(errorCodesPage.closeButton).toBeVisible();
    });

    test('MSUP-CREATE-ERROR-CODE-TC001c_Close icon discards the entry without creating an error code', async ({ errorCodesPage }) => {
        const total = await errorCodesPage.readTotalErrorCodes();
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.fillDescription(`Discarded ${stamp}`);
        await errorCodesPage.closeDialog();
        await errorCodesPage.expectTotalErrorCodes(total);
        await errorCodesPage.search(`Discarded ${stamp}`);
        await errorCodesPage.expectNoRow(`Discarded ${stamp}`);
    });

    test('MSUP-CREATE-ERROR-CODE-TC002a_Machine is a required selector with all machine options', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.expectRequiredLabel('Machine');
        await expect(errorCodesPage.machineSelect).toHaveAccessibleName(/Machine \*/);
        await errorCodesPage.expectMachineOptions(MACHINE_OPTIONS);
    });

    test('MSUP-CREATE-ERROR-CODE-TC002b_No machine is preselected', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.expectNoMachinePreselected();
    });

    test('MSUP-CREATE-ERROR-CODE-TC002c_Only one machine can be selected at a time', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.selectMachine('MPRINT');
        await errorCodesPage.selectMachine('MPURE');
        await errorCodesPage.expectMachineSelected('MPURE');
    });

    test('MSUP-CREATE-ERROR-CODE-TC003a_Severity is a required chip selector with Error and Warning', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await expect(errorCodesPage.severityGroup).toBeVisible();
        await expect(errorCodesPage.severityError).toBeVisible();
        await expect(errorCodesPage.severityWarning).toBeVisible();
        await errorCodesPage.expectRequiredLabel('Severity');
    });

    test('MSUP-CREATE-ERROR-CODE-TC003b_Only one severity can be selected at a time', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.expectSeveritySelected('Error');
        await errorCodesPage.selectSeverity('Warning');
        await errorCodesPage.expectSeveritySelected('Warning');
        await errorCodesPage.selectSeverity('Error');
        await errorCodesPage.expectSeveritySelected('Error');
    });

    test('MSUP-CREATE-ERROR-CODE-TC003c_Severity prefix is auto-filled and not editable', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.expectErrorPrefix('E');
        await errorCodesPage.selectSeverity('Warning');
        await errorCodesPage.expectErrorPrefix('W');
        await errorCodesPage.selectSeverity('Error');
        await errorCodesPage.expectErrorPrefix('E');
    });

    test('MSUP-CREATE-ERROR-CODE-TC004a_System shows short code, full name and helper text', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await expect(errorCodesPage.systemShortInput).toBeVisible();
        await expect(errorCodesPage.systemNameInput).toBeVisible();
        await expect(errorCodesPage.systemHelperText).toBeVisible();
    });

    test('MSUP-CREATE-ERROR-CODE-TC004b_Selecting an existing short code auto-populates the full name', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.selectMachine('MPRINT');
        await errorCodesPage.selectSystemShort('ECA');
        await errorCodesPage.expectSystem('ECA', 'Electric');
    });

    test('MSUP-CREATE-ERROR-CODE-TC004c_Selecting an existing full name auto-populates the short code', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.selectMachine('MPRINT');
        await errorCodesPage.pickSystemByFullName('Elec', 'Electric');
        await errorCodesPage.expectSystem('ECA', 'Electric');
    });

    test('MSUP-CREATE-ERROR-CODE-TC004d_Short code is limited to three characters', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.typeNewSystem('abcd', 'Auto System');
        await expect(errorCodesPage.systemShortInput).toHaveValue('ABC');
    });

    test('MSUP-CREATE-ERROR-CODE-TC005a_Subsystem 1 and 2 show name first with a read-only number', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await expect(errorCodesPage.subsystem1Input).toBeVisible();
        await expect(errorCodesPage.subsystem2Input).toBeVisible();
        await expect(errorCodesPage.subsystem1Number).toBeDisabled();
        await expect(errorCodesPage.subsystem2Number).toBeDisabled();
        await expect(errorCodesPage.errorNumber).toBeDisabled();
    });

    test('MSUP-CREATE-ERROR-CODE-TC005b_Picking an existing subsystem name shows its existing number', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.selectMachine('MPRINT');
        await errorCodesPage.selectSystemShort('ECA');
        await expect(errorCodesPage.subsystem1Number).toHaveValue('');
        await errorCodesPage.pickFirstSubsystem1Suggestion();
        await expect(errorCodesPage.subsystem1Number).toHaveValue(/^\d{2,}$/);
    });

    test('MSUP-CREATE-ERROR-CODE-TC005c_A new subsystem name shows Auto as its number', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.selectMachine('MPRINT');
        await errorCodesPage.selectSystemShort('ECA');
        await errorCodesPage.fillSubsystem1(`New sub ${stamp}`);
        await expect(errorCodesPage.subsystem1Number).toHaveValue('');
        await expect(errorCodesPage.subsystem1Number).toHaveAttribute('placeholder', 'Auto');
    });

    test('MSUP-CREATE-ERROR-CODE-TC005d_Suggestions need the parent field to be filled first', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.systemShortInput.click();
        await errorCodesPage.expectSuggestionNote('Fill in the machine first to see existing suggestions.');
        await errorCodesPage.subsystem2Input.click();
        await errorCodesPage.expectSuggestionNote('Fill in Subsystem 1 first to see existing suggestions.');
    });

    test('MSUP-CREATE-ERROR-CODE-TC005e_Fields can be filled in any order without clearing each other', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.fillDescription(`Order ${stamp}`);
        await errorCodesPage.fillSubsystem2(`Order sub2 ${stamp}`);
        await errorCodesPage.selectMachine('MPRINT');
        await errorCodesPage.selectSeverity('Warning');
        await expect(errorCodesPage.descriptionInput).toHaveValue(`Order ${stamp}`);
        await expect(errorCodesPage.subsystem2Input).toHaveValue(`Order sub2 ${stamp}`);
    });

    test('MSUP-CREATE-ERROR-CODE-TC006a_Error Number group shows prefix, description and helper text', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await expect(errorCodesPage.errorPrefix).toBeVisible();
        await expect(errorCodesPage.descriptionInput).toBeVisible();
        await expect(errorCodesPage.errorNumber).toHaveAttribute('placeholder', 'Auto');
        await expect(errorCodesPage.errorNumberHelperText).toBeVisible();
    });

    test('MSUP-CREATE-ERROR-CODE-TC007a_Solutions are optional and accept free text', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await expect(errorCodesPage.addSolutionButton).toBeVisible();
        await errorCodesPage.addSolution(`Solution text ${stamp}`);
    });

    test('MSUP-CREATE-ERROR-CODE-TC008a_Create Error Code button is shown in the modal', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await expect(errorCodesPage.submitButton).toBeVisible();
        await expect(errorCodesPage.permanentNote).toBeVisible();
    });

    test('MSUP-CREATE-ERROR-CODE-TC008b_Submitting with empty required fields shows validation and creates nothing', async ({ errorCodesPage }) => {
        const total = await errorCodesPage.readTotalErrorCodes();
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.submit();
        await errorCodesPage.expectRequiredValidationMessages();
        await errorCodesPage.closeDialog();
        await errorCodesPage.expectTotalErrorCodes(total);
    });

    test('MSUP-CREATE-ERROR-CODE-TC009a_Creating an error code generates the code and updates the table and counters', async ({ errorCodesPage }) => {
        totalBefore = await errorCodesPage.readTotalErrorCodes();
        solutionsBefore = await errorCodesPage.readSolutionsProvided();

        await errorCodesPage.openCreateDialog();
        await errorCodesPage.createErrorCode(newErrorCode);

        await errorCodesPage.search(newErrorCode.description);
        const row = errorCodesPage.rowByText(newErrorCode.description);
        await expect(row).toBeVisible();
        await expect(row.getByRole('cell').first()).toHaveText(createdCodePattern);
        await expect(row).toContainText(`${newErrorCode.subsystem1}/${newErrorCode.subsystem2}`);
        await expect(row).toContainText('Electric');
    });

    test('MSUP-CREATE-ERROR-CODE-TC009b_Total Error Codes and Solutions Provided counts update', async ({ errorCodesPage }) => {
        await errorCodesPage.expectTotalErrorCodes(totalBefore + 1);
        await errorCodesPage.expectSolutionsProvided(solutionsBefore + 1);
    });

    test('MSUP-CREATE-ERROR-CODE-TC010a_Duplicate error shows a warning and disables Create Error Code', async ({ errorCodesPage }) => {
        await errorCodesPage.openCreateDialog();
        await errorCodesPage.fillForm({ ...newErrorCode, solution: undefined });
        await errorCodesPage.expectDuplicateWarning(createdCodeInTextPattern);
    });

    test('MSUP-CREATE-ERROR-CODE-TC011a_Created error code is available for search and filtering', async ({ errorCodesPage }) => {
        await errorCodesPage.search(newErrorCode.description);
        await errorCodesPage.expectRowVisible(newErrorCode.description);

        await errorCodesPage.filterByMachineType('mpr');
        await errorCodesPage.expectRowVisible(newErrorCode.description);

        await errorCodesPage.filterByErrorType('error');
        await errorCodesPage.expectRowVisible(newErrorCode.description);

        await errorCodesPage.filterByView('active');
        await errorCodesPage.expectRowVisible(newErrorCode.description);

        await errorCodesPage.filterByErrorType('warning');
        await errorCodesPage.expectNoRow(newErrorCode.description);
    });

    test('MSUP-CREATE-ERROR-CODE-TC012a_Clicking a row opens the details panel with an Edit button', async ({ errorCodesPage }) => {
        await errorCodesPage.openDetails(currentDescription);
        await expect(errorCodesPage.detailsCode).toHaveText(createdCodePattern);
        await errorCodesPage.expectDetails({ description: currentDescription, solutions: [newErrorCode.solution!] });
    });

    test('MSUP-CREATE-ERROR-CODE-TC012b_Edit button switches the panel to the Edit Error Code form', async ({ errorCodesPage }) => {
        await errorCodesPage.openDetails(currentDescription);
        await errorCodesPage.startEdit();
        await expect(errorCodesPage.descriptionInput).toHaveValue(currentDescription);
        await expect(errorCodesPage.updateButton).toBeVisible();
        await expect(errorCodesPage.cancelEditButton).toBeVisible();
    });

    test('MSUP-CREATE-ERROR-CODE-TC012c_Only description and solutions are editable', async ({ errorCodesPage }) => {
        await errorCodesPage.openDetails(currentDescription);
        await errorCodesPage.startEdit();
        await errorCodesPage.expectReadOnlyFieldsDisabled();
        await expect(errorCodesPage.editNotice).toBeVisible();
    });

    test('MSUP-CREATE-ERROR-CODE-TC012d_Update Error Code is disabled until a change is made', async ({ errorCodesPage }) => {
        await errorCodesPage.openDetails(currentDescription);
        await errorCodesPage.startEdit();
        await expect(errorCodesPage.updateButton).toBeDisabled();
        await errorCodesPage.fillDescription(`${currentDescription} changed`);
        await expect(errorCodesPage.updateButton).toBeEnabled();
    });

    test('MSUP-CREATE-ERROR-CODE-TC012e_Cancel discards the edit', async ({ errorCodesPage }) => {
        await errorCodesPage.openDetails(currentDescription);
        await errorCodesPage.startEdit();
        await errorCodesPage.fillDescription(`Discarded edit ${stamp}`);
        await errorCodesPage.cancelEdit();
        await errorCodesPage.expectDetails({ description: currentDescription });
        await expect(errorCodesPage.detailsDescription).not.toContainText(`Discarded edit ${stamp}`);
    });

    test('MSUP-CREATE-ERROR-CODE-TC012f_Clearing the description shows a validation message', async ({ errorCodesPage }) => {
        await errorCodesPage.openDetails(currentDescription);
        await errorCodesPage.startEdit();
        await errorCodesPage.fillDescription('');
        await errorCodesPage.updateButton.click();
        await expect(errorCodesPage.dialog.getByText('Description is required')).toBeVisible();
        await expect(errorCodesPage.editHeading).toBeVisible();
    });

    test('MSUP-CREATE-ERROR-CODE-TC012g_Editing the description updates the panel and the table', async ({ errorCodesPage }) => {
        await errorCodesPage.openDetails(currentDescription);
        await errorCodesPage.startEdit();
        await errorCodesPage.fillDescription(editedDescription);
        await errorCodesPage.update();
        await errorCodesPage.expectDetails({ description: editedDescription });
        currentDescription = editedDescription;

        await errorCodesPage.search(editedDescription);
        await errorCodesPage.expectRowVisible(editedDescription);
    });

    test('MSUP-CREATE-ERROR-CODE-TC012h_Adding a solution updates the panel and Solutions Provided', async ({ errorCodesPage }) => {
        const solutions = await errorCodesPage.readSolutionsProvided();
        await errorCodesPage.openDetails(currentDescription);
        await errorCodesPage.startEdit();
        await errorCodesPage.addSolution(addedSolution);
        await errorCodesPage.update();
        await errorCodesPage.expectDetails({ solutions: [newErrorCode.solution!, addedSolution] });
        await errorCodesPage.expectSolutionsProvided(solutions + 1);
    });

    test('MSUP-CREATE-ERROR-CODE-TC012i_Editing an existing solution updates its text', async ({ errorCodesPage }) => {
        await errorCodesPage.openDetails(currentDescription);
        await errorCodesPage.startEdit();
        await errorCodesPage.editSolution(addedSolution, editedSolution);
        await errorCodesPage.update();
        await errorCodesPage.expectDetails({ solutions: [editedSolution], absentSolutions: [addedSolution] });
    });

    test('MSUP-CREATE-ERROR-CODE-TC012j_Removing a solution updates the panel and Solutions Provided', async ({ errorCodesPage }) => {
        const solutions = await errorCodesPage.readSolutionsProvided();
        await errorCodesPage.openDetails(currentDescription);
        await errorCodesPage.startEdit();
        await errorCodesPage.removeSolution(editedSolution);
        await errorCodesPage.update();
        await errorCodesPage.expectDetails({ solutions: [newErrorCode.solution!], absentSolutions: [editedSolution] });
        await errorCodesPage.expectSolutionsProvided(solutions - 1);
    });

    test('MSUP-CREATE-ERROR-CODE-TC013a_Archive the created error code to restore test data', async ({ errorCodesPage }) => {
        await errorCodesPage.search(currentDescription);
        await errorCodesPage.archiveRow(currentDescription);
        await errorCodesPage.expectTotalErrorCodes(totalBefore);
        await errorCodesPage.expectSolutionsProvided(solutionsBefore);
    });
});
