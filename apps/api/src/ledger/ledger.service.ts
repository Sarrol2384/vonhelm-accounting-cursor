import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@accounting/db';
import { assertCompanyAccess } from '../auth/jwt.strategy';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LedgerService {
  private readonly db = prisma

  constructor(
    private readonly audit: AuditService,
  ) {}

  async listAccounts(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.account.findMany({
      where: { companyId },
      orderBy: { code: 'asc' },
    });
  }

  async createAccount(userId: string, companyId: string, data: Record<string, unknown>) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.account.create({ data: { companyId, ...(data as object) } as never });
  }

  async listJournals(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.journalEntry.findMany({
      where: { companyId },
      include: { lines: { include: { account: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async createJournal(
    userId: string,
    companyId: string,
    data: {
      date: string;
      reference?: string;
      description?: string;
      lines: Array<{ accountId: string; debit?: number; credit?: number; description?: string }>;
      post?: boolean;
    },
  ) {
    await assertCompanyAccess(this.db, userId, companyId);
    const totalDebit = data.lines.reduce((s, l) => s + (l.debit ?? 0), 0);
    const totalCredit = data.lines.reduce((s, l) => s + (l.credit ?? 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException('Journal entry must balance');
    }

    const entry = await this.db.journalEntry.create({
      data: {
        companyId,
        date: new Date(data.date),
        reference: data.reference,
        description: data.description,
        status: data.post ? 'POSTED' : 'DRAFT',
        lines: {
          create: data.lines.map((l) => ({
            accountId: l.accountId,
            debit: l.debit ?? 0,
            credit: l.credit ?? 0,
            description: l.description,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });
    await this.audit.log(companyId, userId, 'CREATE', 'JournalEntry', entry.id);
    return entry;
  }

  async postJournal(userId: string, companyId: string, id: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.journalEntry.update({
      where: { id, companyId },
      data: { status: 'POSTED' },
    });
  }

  async trialBalance(userId: string, companyId: string, asOf?: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    const dateFilter = asOf ? { lte: new Date(asOf) } : undefined;
    const lines = await this.db.journalLine.findMany({
      where: {
        journalEntry: { companyId, status: 'POSTED', date: dateFilter },
      },
      include: { account: true },
    });

    const balances = new Map<string, { code: string; name: string; type: string; debit: number; credit: number }>();
    for (const line of lines) {
      const key = line.accountId;
      const existing = balances.get(key) ?? {
        code: line.account.code,
        name: line.account.name,
        type: line.account.type,
        debit: 0,
        credit: 0,
      };
      existing.debit += Number(line.debit);
      existing.credit += Number(line.credit);
      balances.set(key, existing);
    }

    const rows = Array.from(balances.values()).map((b) => ({
      ...b,
      balance: b.debit - b.credit,
    }));

    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);

    return { asOf: asOf ?? new Date().toISOString(), rows, totalDebit, totalCredit };
  }

  async lockPeriod(userId: string, companyId: string, lockDate: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    const lock = await this.db.periodLock.create({
      data: { companyId, lockDate: new Date(lockDate), lockedBy: userId },
    });
    await this.audit.log(companyId, userId, 'LOCK_PERIOD', 'PeriodLock', lock.id, { lockDate });
    return lock;
  }

  async listPeriodLocks(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.periodLock.findMany({ where: { companyId }, orderBy: { lockDate: 'desc' } });
  }
}
