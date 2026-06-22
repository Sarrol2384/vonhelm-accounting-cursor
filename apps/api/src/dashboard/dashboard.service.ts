import { Injectable } from '@nestjs/common';
import { prisma } from '@accounting/db';
import { assertCompanyAccess } from '../auth/jwt.strategy';

@Injectable()
export class DashboardService {
  private readonly db = prisma

  constructor() {}

  async getKpis(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);

    const [bankAccounts, unreconciled, openVat, overdueInvoices, overdueBills] = await Promise.all([
      this.db.bankAccount.findMany({ where: { companyId }, include: { transactions: true } }),
      this.db.bankTransaction.count({
        where: { bankAccount: { companyId }, status: { in: ['NEW', 'REVIEWED'] } },
      }),
      this.db.vatPeriod.findFirst({ where: { companyId, status: 'OPEN' } }),
      this.db.taxInvoice.count({
        where: {
          companyId,
          status: { in: ['SENT', 'PARTIALLY_PAID'] },
          dueDate: { lt: new Date() },
        },
      }),
      this.db.supplierBill.count({
        where: {
          companyId,
          status: { in: ['RECEIVED', 'PARTIALLY_PAID'] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    const cashPosition = bankAccounts.reduce((sum, acc) => {
      const txTotal = acc.transactions.reduce((s, t) => {
        const received = t.received ? Number(t.received) : 0;
        const spent = t.spent ? Number(t.spent) : 0;
        return s + received - spent;
      }, Number(acc.openingBalance));
      return sum + txTotal;
    }, 0);

    return {
      cashPosition,
      unreconciledTransactions: unreconciled,
      vatPayable: openVat ? Number(openVat.vatPayable) : 0,
      vatPeriodRef: openVat?.ref,
      overdueDebtors: overdueInvoices,
      overdueCreditors: overdueBills,
      periodCloseBlockers: unreconciled > 0 ? ['Unreconciled bank transactions'] : [],
    };
  }

  async search(userId: string, firmId: string, q: string) {
    const memberships = await this.db.companyMembership.findMany({
      where: { userId },
      select: { companyId: true },
    });
    const companyIds = memberships.map((m) => m.companyId);

    const [customers, suppliers, invoices, journals, vatPeriods] = await Promise.all([
      this.db.customer.findMany({
        where: { companyId: { in: companyIds }, name: { contains: q, mode: 'insensitive' } },
        take: 5,
      }),
      this.db.supplier.findMany({
        where: { companyId: { in: companyIds }, name: { contains: q, mode: 'insensitive' } },
        take: 5,
      }),
      this.db.taxInvoice.findMany({
        where: { companyId: { in: companyIds }, number: { contains: q, mode: 'insensitive' } },
        take: 5,
        include: { customer: true },
      }),
      this.db.journalEntry.findMany({
        where: {
          companyId: { in: companyIds },
          OR: [
            { reference: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      this.db.vatPeriod.findMany({
        where: { companyId: { in: companyIds }, ref: { contains: q, mode: 'insensitive' } },
        take: 5,
      }),
    ]);

    return {
      customers: customers.map((c) => ({ type: 'customer', id: c.id, label: c.name, companyId: c.companyId })),
      suppliers: suppliers.map((s) => ({ type: 'supplier', id: s.id, label: s.name, companyId: s.companyId })),
      invoices: invoices.map((i) => ({ type: 'invoice', id: i.id, label: i.number, companyId: i.companyId })),
      journals: journals.map((j) => ({ type: 'journal', id: j.id, label: j.reference ?? j.id, companyId: j.companyId })),
      vatPeriods: vatPeriods.map((v) => ({ type: 'vat', id: v.id, label: v.ref, companyId: v.companyId })),
    };
  }
}
