// ticket.spec.ts
import { Page } from '@playwright/test';
import { test } from '../fixtures/fixtures';
import { TicketPage } from '../pages/TicketsPage';
import dotenv from 'dotenv';

dotenv.config();

function generateTicketName() {
    return `Test Ticket ${Date.now()}`;
}

type AdminType = 'Global Admin' | 'Organization Admin - Extended' | 'Organization Admin - Basic';

interface AdminConfig {
    name: AdminType;
    tcSuffix: string;
    // Undefined credentials means use the shared auth.json (Global Admin)
    email?: string;
    password?: string;
    canDelete?: boolean;
}

const adminConfigs: AdminConfig[] = [
    {
        name: 'Global Admin',
        tcSuffix: '',
        canDelete: true,
    },
    {
        name: 'Organization Admin - Extended',
        tcSuffix: 'a',
        email: process.env.ORG_EXT_EMAIL,
        password: process.env.ORG_EXT_PASSWORD,
    },
    {
        name: 'Organization Admin - Basic',
        tcSuffix: 'b',
        email: process.env.ORG_BASIC_EMAIL,
        password: process.env.ORG_BASIC_PASSWORD,
    },
];

for (const admin of adminConfigs) {
    test.describe.serial(`Ticket CRUD flow - ${admin.name}`, () => {
        let ticketPage: TicketPage;
        let pageTicketName: string;
        let updatedTicketName: string;
        let page: Page;

        test.beforeAll(async ({ createTicketPage }) => {
            const credentials = admin.email && admin.password
                ? { email: admin.email, password: admin.password }
                : undefined;
            ({ ticketPage, page } = await createTicketPage(credentials));
        });

        test.afterAll(async () => {
            await page.close();
        });

        test(`MSUP-TICKET-TC007${admin.tcSuffix}_Add Ticket - ${admin.name}`, async () => {
            pageTicketName = generateTicketName();
            await ticketPage.addTicket(pageTicketName, admin.name);
        });

        test(`MSUP-TICKET-TC008${admin.tcSuffix}_Search Ticket - ${admin.name}`, async () => {
            await ticketPage.searchTicket(pageTicketName);
        });

        test(`MSUP-TICKET-TC009${admin.tcSuffix}_View Ticket - ${admin.name}`, async () => {
            await ticketPage.searchTicket(pageTicketName);
        });

        test(`MSUP-TICKET-TC010${admin.tcSuffix}_Edit Ticket - ${admin.name}`, async () => {
            updatedTicketName = `${pageTicketName} Updated`;
            await ticketPage.editTicket(pageTicketName, updatedTicketName);
        });

        if (admin.canDelete) {
            test(`MSUP-TICKET-TC011${admin.tcSuffix}_Delete Ticket - ${admin.name}`, async () => {
                await ticketPage.deleteTicket(updatedTicketName);
            });
        }
    });
}