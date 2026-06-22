import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@accounting/db';
import { assertCompanyAccess } from '../auth/jwt.strategy';

@Injectable()
export class CompaniesService {
  private readonly db = prisma

  constructor() {}

  async listConsole(userId: string, firmId: string, search?: string, status?: string) {
    const companies = await this.db.company.findMany({
      where: {
        firmId,
        status: status && status !== 'all' ? (status as 'ACTIVE') : undefined,
        OR: search
          ? [
              { name: { contains: search, mode: 'insensitive' } },
              { tradingName: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: {
        _count: { select: { alerts: { where: { isRead: false } }, tasks: true, notes: true } },
        alerts: { where: { isRead: false }, take: 5 },
      },
      orderBy: { name: 'asc' },
    });

    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      tradingName: c.tradingName,
      contactName: c.email ? c.email.split('@')[0] : 'No Contact Name Available',
      taskCount: c._count.tasks,
      noteCount: c._count.notes,
      alertCount: c._count.alerts,
      alerts: c.alerts,
      lastLoginAt: c.lastLoginAt,
      financialYearEnd: `${String(c.financialYearEndDay).padStart(2, '0')}/${String(c.financialYearEndMonth).padStart(2, '0')}`,
      nextVatSubmissionDue: c.nextVatSubmissionDue,
      lastTransactionDate: c.lastTransactionDate,
      subscription: 'Accounting',
      status: c.status,
      compliance: {
        vat: c.nextVatSubmissionDue ? (new Date(c.nextVatSubmissionDue) < new Date(Date.now() + 30 * 86400000) ? 'warning' : 'ok') : 'unknown',
        alerts: c._count.alerts > 3 ? 'critical' : c._count.alerts > 0 ? 'warning' : 'ok',
      },
    }));
  }

  async getOne(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    const company = await this.db.company.findUnique({
      where: { id: companyId },
      include: { vatSettings: true },
    });
    if (!company) throw new NotFoundException();
    await this.db.company.update({
      where: { id: companyId },
      data: { lastLoginAt: new Date() },
    });
    return company;
  }

  async update(userId: string, companyId: string, data: Record<string, unknown>) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.company.update({ where: { id: companyId }, data: data as never });
  }
}
