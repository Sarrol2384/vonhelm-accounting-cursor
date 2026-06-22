import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BankTransactionStatus } from '@accounting/db';
import { prisma } from '@accounting/db';
import { assertCompanyAccess } from '../auth/jwt.strategy';
import { AuditService } from '../audit/audit.service';
import { AbPipelineService } from '../owner/ab-pipeline.service';
import { parseBankTransactionDate } from './bank-date';

@Injectable()
export class BankingService {
  private readonly db = prisma

  constructor(
    private readonly audit: AuditService,
    private readonly abPipeline: AbPipelineService,
  ) {}

  async listAccounts(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    const accounts = await this.db.bankAccount.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });

    if (accounts.length === 0) return [];

    const [totals, pendingCounts] = await Promise.all([
      this.db.bankTransaction.groupBy({
        by: ['bankAccountId'],
        where: { bankAccount: { companyId } },
        _sum: { received: true, spent: true },
      }),
      this.db.bankTransaction.groupBy({
        by: ['bankAccountId'],
        where: { bankAccount: { companyId }, status: 'NEW' },
        _count: { _all: true },
      }),
    ]);

    const totalsMap = new Map(totals.map((row) => [row.bankAccountId, row._sum]));
    const pendingMap = new Map(pendingCounts.map((row) => [row.bankAccountId, row._count._all]));

    return accounts.map((acc) => {
      const sum = totalsMap.get(acc.id);
      const received = Number(sum?.received ?? 0);
      const spent = Number(sum?.spent ?? 0);
      const balance = Number(acc.openingBalance) + received - spent;
      return {
        id: acc.id,
        companyId: acc.companyId,
        name: acc.name,
        accountNumber: acc.accountNumber,
        bankName: acc.bankName,
        openingBalance: Number(acc.openingBalance),
        isCreditCard: acc.isCreditCard,
        glAccountId: acc.glAccountId,
        createdAt: acc.createdAt,
        updatedAt: acc.updatedAt,
        balance,
        pendingReview: pendingMap.get(acc.id) ?? 0,
      };
    });
  }

  async listTransactions(
    userId: string,
    companyId: string,
    accountId: string,
    status?: string,
    limit?: number,
  ) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.bankTransaction.findMany({
      where: {
        bankAccountId: accountId,
        bankAccount: { companyId },
        status: status ? (status as BankTransactionStatus) : undefined,
      },
      include: { selection: true },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  async createTransaction(userId: string, companyId: string, accountId: string, data: Record<string, unknown>) {
    await assertCompanyAccess(this.db, userId, companyId);
    const txn = await this.db.bankTransaction.create({
      data: { bankAccountId: accountId, ...(data as object) } as never,
    });
    await this.applyRules(companyId, txn.id);
    await this.abPipeline.processTransaction(companyId, txn.id);
    await this.audit.log(companyId, userId, 'CREATE', 'BankTransaction', txn.id);
    return txn;
  }

  async updateTransaction(userId: string, companyId: string, id: string, data: Record<string, unknown>) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.bankTransaction.update({ where: { id }, data: data as never });
  }

  async markReviewed(userId: string, companyId: string, ids: string[]) {
    await assertCompanyAccess(this.db, userId, companyId);
    await this.db.bankTransaction.updateMany({
      where: { id: { in: ids }, bankAccount: { companyId } },
      data: { status: 'REVIEWED' },
    });
    return { updated: ids.length };
  }

  async markReconciled(userId: string, companyId: string, ids: string[]) {
    await assertCompanyAccess(this.db, userId, companyId);
    await this.db.bankTransaction.updateMany({
      where: { id: { in: ids }, bankAccount: { companyId } },
      data: { status: 'RECONCILED', reconciledAt: new Date() },
    });
    return { updated: ids.length };
  }

  async importCsv(userId: string, companyId: string, accountId: string, rows: Array<Record<string, string>>) {
    await assertCompanyAccess(this.db, userId, companyId);

    const account = await this.db.bankAccount.findFirst({
      where: { id: accountId, companyId },
    });
    if (!account) throw new NotFoundException('Bank account not found');

    if (!rows?.length) {
      throw new BadRequestException('No transactions to import. Check your CSV has date and amount columns.');
    }

    const batchId = `import-${Date.now()}`;
    const created = [];
    for (const row of rows) {
      const spent = row.spent ? parseFloat(row.spent) : null;
      const received = row.received ? parseFloat(row.received) : null;
      const txn = await this.db.bankTransaction.create({
        data: {
          bankAccountId: accountId,
          date: parseBankTransactionDate(row.date),
          payee: row.payee,
          description: row.description,
          reference: row.reference,
          spent,
          received,
          importBatchId: batchId,
          status: 'NEW',
        },
      });
      await this.applyRules(companyId, txn.id);
      created.push(txn);
    }
    await this.abPipeline.processImportBatch(
      companyId,
      created.map((t) => t.id),
    );
    await this.audit.log(companyId, userId, 'IMPORT', 'BankTransaction', batchId, { count: created.length });
    return { imported: created.length, batchId };
  }

  async applyRules(companyId: string, transactionId: string) {
    const txn = await this.db.bankTransaction.findUnique({ where: { id: transactionId } });
    if (!txn) return;
    const rules = await this.db.bankRule.findMany({ where: { companyId, isActive: true } });
    const text = `${txn.payee ?? ''} ${txn.description ?? ''}`.toLowerCase();
    for (const rule of rules) {
      if (text.includes(rule.matchText.toLowerCase())) {
        await this.db.bankTransaction.update({
          where: { id: transactionId },
          data: { selectionId: rule.accountId, vatCode: rule.vatCode ?? txn.vatCode },
        });
        break;
      }
    }
  }

  async listRules(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.bankRule.findMany({ where: { companyId }, include: { account: true } });
  }

  async createRule(userId: string, companyId: string, data: Record<string, unknown>) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.bankRule.create({ data: { companyId, ...(data as object) } as never });
  }

  async createAccount(userId: string, companyId: string, data: Record<string, unknown>) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.bankAccount.create({ data: { companyId, ...(data as object) } as never });
  }
}
