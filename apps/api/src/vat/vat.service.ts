import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@accounting/db';
import { assertCompanyAccess } from '../auth/jwt.strategy';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class VatService {
  private readonly db = prisma

  constructor(
    private readonly audit: AuditService,
  ) {}

  async getSettings(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    const [settings, company] = await Promise.all([
      this.db.vatSetting.findUnique({ where: { companyId } }),
      this.db.company.findUnique({ where: { id: companyId } }),
    ]);
    return { settings, company };
  }

  async listPeriods(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.vatPeriod.findMany({
      where: { companyId },
      include: { vatReturn: true },
      orderBy: { periodEnd: 'desc' },
    });
  }

  async calculateVat201(userId: string, companyId: string, periodId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    const period = await this.db.vatPeriod.findFirst({
      where: { id: periodId, companyId },
    });
    if (!period) throw new BadRequestException('Period not found');

    const invoices = await this.db.taxInvoice.findMany({
      where: {
        companyId,
        date: { gte: period.periodStart, lte: period.periodEnd },
        status: { not: 'VOID' },
      },
    });
    const bills = await this.db.supplierBill.findMany({
      where: {
        companyId,
        date: { gte: period.periodStart, lte: period.periodEnd },
        status: { not: 'VOID' },
      },
    });

    const field1 = invoices.reduce((s, i) => s + Number(i.subtotal), 0);
    const field4 = invoices.reduce((s, i) => s + Number(i.vatAmount), 0);
    const field7 = bills.reduce((s, b) => s + Number(b.subtotal), 0);
    const field10 = bills.reduce((s, b) => s + Number(b.vatAmount), 0);
    const field12 = field4 - field10;
    const field13 = field12 > 0 ? field12 : 0;
    const field14 = field12 < 0 ? Math.abs(field12) : 0;

    const vatReturn = await this.db.vatReturn.upsert({
      where: { vatPeriodId: periodId },
      create: {
        vatPeriodId: periodId,
        field1, field4, field7, field10, field12, field13, field14,
      },
      update: {
        field1, field4, field7, field10, field12, field13, field14,
        calculatedAt: new Date(),
      },
    });

    await this.db.vatPeriod.update({
      where: { id: periodId },
      data: {
        vatPayable: field13,
        vatRefundable: field14,
      },
    });

    await this.audit.log(companyId, userId, 'CALCULATE', 'VatReturn', vatReturn.id);
    return { period, vatReturn };
  }

  async closePeriod(userId: string, companyId: string, periodId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    const unreconciled = await this.db.bankTransaction.count({
      where: {
        bankAccount: { companyId },
        status: { in: ['NEW', 'REVIEWED'] },
        date: { lte: new Date() },
      },
    });
    if (unreconciled > 0) {
      throw new BadRequestException(`${unreconciled} unreconciled bank transactions must be cleared first`);
    }

    await this.calculateVat201(userId, companyId, periodId);
    const period = await this.db.vatPeriod.update({
      where: { id: periodId, companyId },
      data: { status: 'CLOSED' },
      include: { vatReturn: true },
    });
    await this.audit.log(companyId, userId, 'CLOSE', 'VatPeriod', periodId);
    return period;
  }

  async markSubmitted(userId: string, companyId: string, periodId: string, submittedAt?: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.vatPeriod.update({
      where: { id: periodId, companyId },
      data: {
        submissionStatus: 'SUBMITTED',
        submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
      },
    });
  }

  async linkPayment(userId: string, companyId: string, periodId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.vatPeriod.update({
      where: { id: periodId, companyId },
      data: { paymentLinked: true, submissionStatus: 'PAID' },
    });
  }

  async reopenPeriod(userId: string, companyId: string, periodId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.vatPeriod.update({
      where: { id: periodId, companyId },
      data: { status: 'OPEN', submissionStatus: 'NOT_SUBMITTED' },
    });
  }
}
