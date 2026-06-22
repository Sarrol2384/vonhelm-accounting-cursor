import { Injectable } from '@nestjs/common';
import { prisma } from '@accounting/db';
import { assertCompanyAccess } from '../auth/jwt.strategy';
import { AuditService } from '../audit/audit.service';

const VAT_RATE = 0.15;

@Injectable()
export class SalesService {
  private readonly db = prisma

  constructor(
    private readonly audit: AuditService,
  ) {}

  // Customers
  async listCustomers(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.customer.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  async createCustomer(userId: string, companyId: string, data: Record<string, unknown>) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.customer.create({ data: { companyId, ...(data as object) } as never });
  }

  // Suppliers
  async listSuppliers(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.supplier.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
  }

  async createSupplier(userId: string, companyId: string, data: Record<string, unknown>) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.supplier.create({ data: { companyId, ...(data as object) } as never });
  }

  // Items
  async listItems(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.item.findMany({ where: { companyId }, orderBy: { code: 'asc' } });
  }

  async createItem(userId: string, companyId: string, data: Record<string, unknown>) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.item.create({ data: { companyId, ...(data as object) } as never });
  }

  // Invoices
  async listInvoices(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.taxInvoice.findMany({
      where: { companyId },
      include: { customer: true, lines: true },
      orderBy: { date: 'desc' },
    });
  }

  async createInvoice(
    userId: string,
    companyId: string,
    data: {
      customerId: string;
      number: string;
      date: string;
      dueDate?: string;
      lines: Array<{ description: string; quantity: number; unitPrice: number }>;
    },
  ) {
    await assertCompanyAccess(this.db, userId, companyId);
    const subtotal = data.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const vatAmount = subtotal * VAT_RATE;
    const total = subtotal + vatAmount;

    const invoice = await this.db.taxInvoice.create({
      data: {
        companyId,
        customerId: data.customerId,
        number: data.number,
        date: new Date(data.date),
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        subtotal,
        vatAmount,
        total,
        lines: {
          create: data.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.quantity * l.unitPrice,
          })),
        },
      },
      include: { customer: true, lines: true },
    });
    await this.audit.log(companyId, userId, 'CREATE', 'TaxInvoice', invoice.id);
    return invoice;
  }

  async allocatePayment(userId: string, companyId: string, invoiceId: string, amount: number) {
    await assertCompanyAccess(this.db, userId, companyId);
    const invoice = await this.db.taxInvoice.findFirst({ where: { id: invoiceId, companyId } });
    if (!invoice) throw new Error('Invoice not found');
    const newPaid = Number(invoice.amountPaid) + amount;
    const status = newPaid >= Number(invoice.total) ? 'PAID' : newPaid > 0 ? 'PARTIALLY_PAID' : invoice.status;
    return this.db.taxInvoice.update({
      where: { id: invoiceId },
      data: { amountPaid: newPaid, status },
    });
  }

  // Bills
  async listBills(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.supplierBill.findMany({
      where: { companyId },
      include: { supplier: true, lines: true },
      orderBy: { date: 'desc' },
    });
  }

  async createBill(
    userId: string,
    companyId: string,
    data: {
      supplierId: string;
      number: string;
      date: string;
      dueDate?: string;
      lines: Array<{ description: string; quantity: number; unitPrice: number }>;
    },
  ) {
    await assertCompanyAccess(this.db, userId, companyId);
    const subtotal = data.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const vatAmount = subtotal * VAT_RATE;
    const total = subtotal + vatAmount;

    const bill = await this.db.supplierBill.create({
      data: {
        companyId,
        supplierId: data.supplierId,
        number: data.number,
        date: new Date(data.date),
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        subtotal,
        vatAmount,
        total,
        lines: {
          create: data.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.quantity * l.unitPrice,
          })),
        },
      },
      include: { supplier: true, lines: true },
    });
    await this.audit.log(companyId, userId, 'CREATE', 'SupplierBill', bill.id);
    return bill;
  }

  async allocateBillPayment(userId: string, companyId: string, billId: string, amount: number) {
    await assertCompanyAccess(this.db, userId, companyId);
    const bill = await this.db.supplierBill.findFirst({ where: { id: billId, companyId } });
    if (!bill) throw new Error('Bill not found');
    const newPaid = Number(bill.amountPaid) + amount;
    const status = newPaid >= Number(bill.total) ? 'PAID' : newPaid > 0 ? 'PARTIALLY_PAID' : bill.status;
    return this.db.supplierBill.update({
      where: { id: billId },
      data: { amountPaid: newPaid, status },
    });
  }
}
