import { Injectable } from '@nestjs/common';
import { prisma } from '@accounting/db';
import { assertCompanyAccess } from '../auth/jwt.strategy';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  private readonly db = prisma

  constructor() {}

  async catalog() {
    return [
      { id: 'trial-balance', name: 'Trial Balance', category: 'Accounts' },
      { id: 'vat-summary', name: 'VAT Summary', category: 'VAT' },
      { id: 'customer-balances', name: 'Customer Balances', category: 'Customers' },
      { id: 'supplier-balances', name: 'Supplier Balances', category: 'Suppliers' },
      { id: 'bank-transactions', name: 'Bank Transactions', category: 'Banking' },
      { id: 'audit-trail', name: 'Audit Trail', category: 'Other' },
    ];
  }

  async generate(userId: string, companyId: string, reportId: string, format: 'json' | 'pdf' | 'xlsx' = 'json') {
    await assertCompanyAccess(this.db, userId, companyId);
    let data: unknown;

    switch (reportId) {
      case 'trial-balance': {
        const lines = await this.db.journalLine.findMany({
          where: { journalEntry: { companyId, status: 'POSTED' } },
          include: { account: true },
        });
        const map = new Map<string, { code: string; name: string; debit: number; credit: number }>();
        for (const l of lines) {
          const e = map.get(l.accountId) ?? { code: l.account.code, name: l.account.name, debit: 0, credit: 0 };
          e.debit += Number(l.debit);
          e.credit += Number(l.credit);
          map.set(l.accountId, e);
        }
        data = { rows: Array.from(map.values()) };
        break;
      }
      case 'vat-summary':
        data = { periods: await this.db.vatPeriod.findMany({ where: { companyId }, include: { vatReturn: true } }) };
        break;
      case 'customer-balances':
        data = {
          customers: await this.db.taxInvoice.groupBy({
            by: ['customerId'],
            where: { companyId, status: { not: 'VOID' } },
            _sum: { total: true, amountPaid: true },
          }),
        };
        break;
      case 'supplier-balances':
        data = {
          suppliers: await this.db.supplierBill.groupBy({
            by: ['supplierId'],
            where: { companyId, status: { not: 'VOID' } },
            _sum: { total: true, amountPaid: true },
          }),
        };
        break;
      case 'bank-transactions':
        data = {
          transactions: await this.db.bankTransaction.findMany({
            where: { bankAccount: { companyId } },
            include: { bankAccount: true },
            orderBy: { date: 'desc' },
          }),
        };
        break;
      case 'audit-trail':
        data = {
          events: await this.db.auditEvent.findMany({
            where: { companyId },
            include: { user: { select: { email: true, firstName: true, lastName: true } } },
            orderBy: { createdAt: 'desc' },
            take: 500,
          }),
        };
        break;
      default:
        data = { error: 'Unknown report' };
    }

    if (format === 'json') return data;
    if (format === 'pdf') return this.toPdf(reportId, data);
    if (format === 'xlsx') return this.toExcel(reportId, data);
    return data;
  }

  private async toPdf(reportId: string, data: unknown): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.fontSize(18).text(`Report: ${reportId}`, { underline: true });
      doc.moveDown();
      doc.fontSize(10).text(JSON.stringify(data, null, 2), { width: 500 });
      doc.end();
    });
  }

  private async toExcel(reportId: string, data: unknown): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(reportId);
    sheet.addRow(['Report', reportId]);
    sheet.addRow(['Generated', new Date().toISOString()]);
    sheet.addRow([]);
    const rows = this.flattenData(data);
    if (rows.length > 0) {
      sheet.addRow(Object.keys(rows[0]));
      rows.forEach((r) => sheet.addRow(Object.values(r)));
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private flattenData(data: unknown): Array<Record<string, unknown>> {
    if (!data || typeof data !== 'object') return [];
    const obj = data as Record<string, unknown>;
    for (const key of ['rows', 'periods', 'transactions', 'events', 'customers', 'suppliers']) {
      if (Array.isArray(obj[key])) return obj[key] as Array<Record<string, unknown>>;
    }
    return [];
  }
}
