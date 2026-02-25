// ticket.spec.ts
import { test, Page } from '@playwright/test';
import { TicketPage } from '../pages/TicketsPage';

// Generate unique ticket names
function generateTicketName() {
  return `Test Ticket ${Date.now()}`;
}

test.describe.serial('Ticket CRUD flow', () => {
  let ticketPage: TicketPage;
  let pageTicketName: string;
  let updatedTicketName: string;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    ticketPage = new TicketPage(page);
    await page.goto(`${process.env.BASE_URL}/dashboard/tickets`);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('MSUP-TICKET-TC007_Add Ticket', async () => {
    pageTicketName = generateTicketName();
    await ticketPage.addTicket(pageTicketName);
  });

  test('MSUP-TICKET-TC008_Search Ticket', async () => {
    await ticketPage.searchTicket(pageTicketName);
  });

  test('MSUP-TICKET-TC009_View Ticket', async () => {
    await ticketPage.searchTicket(pageTicketName);
  });

  test('MSUP-TICKET-TC010_Edit Ticket', async () => {
    updatedTicketName = `${pageTicketName} Updated`;
    await ticketPage.editTicket(pageTicketName, updatedTicketName);
  });

  test('MSUP-TICKET-TC011_Delete Ticket', async () => {
    await ticketPage.deleteTicket(updatedTicketName);
  });
});