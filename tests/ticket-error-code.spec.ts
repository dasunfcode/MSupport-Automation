import { test, expect } from '../fixtures/fixtures';

// Archived via the Error Code Administration page; it must never be offered for tickets.
const ARCHIVED_ERROR_CODE = 'MPR-ECA-11-01-E01';

const ticketName = `Test Ticket ErrorCode ${Date.now()}`;
let assignedCode = '';

test.describe.serial('TICKET ERROR CODE - Select an error code when creating a ticket', () => {

    test('MSUP-TICKET-ERRORCODE-TC001a_Error Code field offers to assign an error code with guidance', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await expect(ticketPage.errorCodeField).toHaveText('Assign error code');
        await ticketPage.errorCodeTooltipTrigger.hover();
        await expect(ticketPage.page.getByRole('tooltip').first()).toContainText('switch to All machines');
    });

    test('MSUP-TICKET-ERRORCODE-TC002a_Clicking the field opens a modal with error codes of the selected machine type', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPRINT');
        await ticketPage.openErrorCodeModal();
        await expect(ticketPage.thisMachineToggle).toHaveText('This machine (MPR)');
        await expect(ticketPage.thisMachineToggle).toHaveAttribute('aria-checked', 'true');
        await ticketPage.expectAllListedCodesStartWith('MPR');
    });

    test('MSUP-TICKET-ERRORCODE-TC002b_Machine type follows the selected device type', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPURE');
        await ticketPage.openErrorCodeModal();
        await expect(ticketPage.thisMachineToggle).toHaveText('This machine (MPU)');
        await ticketPage.expectAllListedCodesStartWith('MPU');
    });

    test('MSUP-TICKET-ERRORCODE-TC002c_Switching to All machines lists error codes of other machines', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPRINT');
        await ticketPage.openErrorCodeModal();
        await ticketPage.allMachinesToggle.click();
        await expect(ticketPage.allMachinesToggle).toHaveAttribute('aria-checked', 'true');
        await expect(async () => {
            const codes = await ticketPage.listedCodes();
            expect(codes.some(code => !code.startsWith('MPR-'))).toBe(true);
        }).toPass();
    });

    test('MSUP-TICKET-ERRORCODE-TC002d_Without a device type only All machines is available', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.openErrorCodeModal();
        await expect(ticketPage.allMachinesToggle).toHaveAttribute('aria-checked', 'true');
        await expect(ticketPage.thisMachineToggle).toHaveCount(0);
    });

    test('MSUP-TICKET-ERRORCODE-TC002e_More error codes load while scrolling the list', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPRINT');
        await ticketPage.openErrorCodeModal();
        await ticketPage.allMachinesToggle.click();
        await ticketPage.loadMoreErrorCodes();
    });

    test('MSUP-TICKET-ERRORCODE-TC003a_Search error codes by description', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPRINT');
        await ticketPage.openErrorCodeModal();
        const first = await ticketPage.readOption(ticketPage.errorCodeOptions.first());

        await ticketPage.searchErrorCodes(first.description);
        await expect(ticketPage.errorCodeOption(first.code)).toBeVisible();
        await ticketPage.expectAllResultsContain(first.description);
    });

    test('MSUP-TICKET-ERRORCODE-TC003b_Search error codes by error number', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPRINT');
        await ticketPage.openErrorCodeModal();
        const first = await ticketPage.readOption(ticketPage.errorCodeOptions.first());

        await ticketPage.searchErrorCodes(first.code);
        await expect(ticketPage.errorCodeOption(first.code)).toBeVisible();
        await ticketPage.expectAllResultsContain(first.code);

        const errorNumber = first.code.split('-').pop()!;
        await ticketPage.searchErrorCodes(errorNumber);
        await expect(ticketPage.errorCodeOption(first.code)).toBeVisible();
        await ticketPage.expectAllResultsContain(errorNumber);
    });

    test('MSUP-TICKET-ERRORCODE-TC003c_Search error codes by faulty part', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPRINT');
        await ticketPage.openErrorCodeModal();
        const first = await ticketPage.readOption(ticketPage.errorCodeOptions.first());

        await ticketPage.searchErrorCodes(first.faultyPart);
        await expect(ticketPage.errorCodeOption(first.code)).toBeVisible();
        await ticketPage.expectAllResultsContain(first.faultyPart);
    });

    test('MSUP-TICKET-ERRORCODE-TC003d_Search also works across all machines', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPRINT');
        await ticketPage.openErrorCodeModal();
        await ticketPage.allMachinesToggle.click();
        const first = await ticketPage.readOption(ticketPage.errorCodeOptions.first());

        await ticketPage.searchErrorCodes(first.code);
        await expect(ticketPage.errorCodeOption(first.code)).toBeVisible();
        await ticketPage.expectAllResultsContain(first.code);
    });

    test('MSUP-TICKET-ERRORCODE-TC003e_Search without a match shows an empty state', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPRINT');
        await ticketPage.openErrorCodeModal();
        await ticketPage.searchErrorCodes(`no-match-${Date.now()}`);
        await expect(ticketPage.noErrorCodesFound).toBeVisible();
        await expect(ticketPage.errorCodeOptions).toHaveCount(0);
    });

    test('MSUP-TICKET-ERRORCODE-TC004a_Archived error code is not offered for the selected machine', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPRINT');
        await ticketPage.openErrorCodeModal();
        await ticketPage.expectErrorCodeNotListed(ARCHIVED_ERROR_CODE);
    });

    test('MSUP-TICKET-ERRORCODE-TC004b_Archived error code is not offered under All machines', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPRINT');
        await ticketPage.openErrorCodeModal();
        await ticketPage.allMachinesToggle.click();
        await ticketPage.expectErrorCodeNotListed(ARCHIVED_ERROR_CODE);
    });

    test('MSUP-TICKET-ERRORCODE-TC005a_Assign Error Code is disabled until a code is selected', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPRINT');
        await ticketPage.openErrorCodeModal();
        await expect(ticketPage.assignSubmitButton).toBeDisabled();
        await ticketPage.errorCodeOptions.first().click();
        await expect(ticketPage.assignSubmitButton).toBeEnabled();
    });

    test('MSUP-TICKET-ERRORCODE-TC005b_Selected error code is shown on the form with its description', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPRINT');
        await ticketPage.openErrorCodeModal();
        const { description } = await ticketPage.readOption(ticketPage.errorCodeOptions.first());
        const code = await ticketPage.selectErrorCode(ticketPage.errorCodeOptions.first());

        await ticketPage.expectAssignedErrorCode(code);
        await expect(ticketPage.errorCodeReferenceDescription).toHaveText(description);
    });

    test('MSUP-TICKET-ERRORCODE-TC005c_Selected error code can be changed', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPRINT');
        await ticketPage.openErrorCodeModal();
        const firstCode = await ticketPage.selectErrorCode(ticketPage.errorCodeOptions.first());

        await ticketPage.changeErrorCodeButton.click();
        await expect(ticketPage.assignDialog).toBeVisible();
        const secondCode = await ticketPage.selectErrorCode(ticketPage.errorCodeOptions.nth(1));

        expect(secondCode).not.toBe(firstCode);
        await ticketPage.expectAssignedErrorCode(secondCode);
    });

    test('MSUP-TICKET-ERRORCODE-TC005d_Closing the modal without selecting leaves the field unassigned', async ({ ticketPage }) => {
        await ticketPage.openAddTicketForm();
        await ticketPage.selectDeviceType('MPRINT');
        await ticketPage.openErrorCodeModal();
        await ticketPage.closeErrorCodeModal();
        await expect(ticketPage.errorCodeField).toHaveText('Assign error code');
        await expect(ticketPage.assignedErrorCode).toHaveCount(0);
    });

    test('MSUP-TICKET-ERRORCODE-TC006a_Ticket is created with the selected error code', async ({ ticketPage }) => {
        const code = await ticketPage.addTicket(ticketName, 'Global Admin', true);
        assignedCode = code!;

        await ticketPage.openTicketDetails(ticketName);
        await ticketPage.expectDetailsErrorCode(assignedCode);
    });

    test('MSUP-TICKET-ERRORCODE-TC006b_Delete the ticket created with an error code', async ({ ticketPage }) => {
        await ticketPage.deleteTicket(ticketName);
    });
});
