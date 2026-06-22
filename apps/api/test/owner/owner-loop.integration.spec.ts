import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

for (const envPath of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../.env'),
  resolve(process.cwd(), '../../.env'),
]) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as bcrypt from 'bcryptjs';
import { prisma, UserRole, CompanyStatus, AccountType } from '@accounting/db';
import { AuditService } from '../../src/audit/audit.service';
import { BankingService } from '../../src/banking/banking.service';
import { AbPipelineService } from '../../src/owner/ab-pipeline.service';
import { OwnerService } from '../../src/owner/owner.service';
import { APPROVAL_CHOICE_YES } from '../../src/owner/owner.constants';

const audit = new AuditService();
const abPipeline = new AbPipelineService();
const banking = new BankingService(audit, abPipeline);
const owner = new OwnerService();

type TestCtx = {
  firmId: string;
  userId: string;
  companyId: string;
  bankAccountId: string;
  glAccountId: string;
};

let ctx: TestCtx | null = null;

async function probeDb() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function createTestContext(): Promise<TestCtx> {
  const passwordHash = await bcrypt.hash('test-pass', 10);
  const firm = await prisma.firm.create({ data: { name: `S2 Test Firm ${Date.now()}` } });
  const user = await prisma.user.create({
    data: {
      email: `s2-test-${Date.now()}@example.com`,
      passwordHash,
      firstName: 'S2',
      lastName: 'Test',
      role: UserRole.FIRM_ADMIN,
      firmId: firm.id,
    },
  });
  const company = await prisma.company.create({
    data: {
      firmId: firm.id,
      name: 'S2 Integration Co',
      status: CompanyStatus.ACTIVE,
    },
  });
  await prisma.companyMembership.create({
    data: { userId: user.id, companyId: company.id },
  });
  const glAccount = await prisma.account.create({
    data: {
      companyId: company.id,
      code: '6100',
      name: 'Rent Expense (6100)',
      type: AccountType.EXPENSE,
    },
  });
  const bankAccount = await prisma.bankAccount.create({
    data: {
      companyId: company.id,
      name: 'Test Cheque',
      openingBalance: 0,
      glAccountId: glAccount.id,
    },
  });
  return {
    firmId: firm.id,
    userId: user.id,
    companyId: company.id,
    bankAccountId: bankAccount.id,
    glAccountId: glAccount.id,
  };
}

async function destroyTestContext(c: TestCtx) {
  await prisma.ownerAction.deleteMany({ where: { companyId: c.companyId } });
  await prisma.bankTransaction.deleteMany({
    where: { bankAccount: { companyId: c.companyId } },
  });
  await prisma.bankRule.deleteMany({ where: { companyId: c.companyId } });
  await prisma.bankAccount.deleteMany({ where: { companyId: c.companyId } });
  await prisma.account.deleteMany({ where: { companyId: c.companyId } });
  await prisma.companyMembership.deleteMany({ where: { companyId: c.companyId } });
  await prisma.company.delete({ where: { id: c.companyId } });
  await prisma.user.delete({ where: { id: c.userId } });
  await prisma.firm.delete({ where: { id: c.firmId } });
}

const dbAvailable = Boolean(process.env.DATABASE_URL);

(dbAvailable ? describe : describe.skip)('owner loop integration', () => {
  before(async () => {
    if (!(await probeDb())) {
      throw new Error('Database unavailable — set DATABASE_URL and run pnpm db:local');
    }
    ctx = await createTestContext();
  });

  after(async () => {
    if (ctx) await destroyTestContext(ctx);
    await prisma.$disconnect();
  });

  it('1. CSV import creates transactions', async () => {
    assert.ok(ctx);
    const result = await banking.importCsv(ctx.userId, ctx.companyId, ctx.bankAccountId, [
      {
        date: '2026-06-15',
        payee: 'Unknown Vendor',
        description: 'Unknown Vendor',
        reference: '',
        spent: '250',
        received: '',
      },
    ]);
    assert.equal(result.imported, 1);
    const count = await prisma.bankTransaction.count({
      where: { bankAccountId: ctx.bankAccountId },
    });
    assert.equal(count, 1);
  });

  it('2. uncategorized txn creates PENDING OwnerAction', async () => {
    assert.ok(ctx);
    const pending = await prisma.ownerAction.findMany({
      where: { companyId: ctx.companyId, status: 'PENDING' },
    });
    assert.ok(pending.length >= 1);
  });

  it('3. categorized txn auto-handles without pending action', async () => {
    assert.ok(ctx);
    await prisma.bankRule.create({
      data: {
        companyId: ctx.companyId,
        name: 'Rent rule',
        matchText: 'Rent Office',
        accountId: ctx.glAccountId,
        isActive: true,
      },
    });
    await banking.importCsv(ctx.userId, ctx.companyId, ctx.bankAccountId, [
      {
        date: '2026-06-16',
        payee: 'Rent Office',
        description: 'Rent Office',
        reference: '',
        spent: '15000',
        received: '',
      },
    ]);
    const txn = await prisma.bankTransaction.findFirst({
      where: { bankAccountId: ctx.bankAccountId, payee: 'Rent Office' },
    });
    assert.ok(txn?.selectionId);
    const action = await prisma.ownerAction.findFirst({
      where: { bankTransactionId: txn!.id, status: 'PENDING' },
    });
    assert.equal(action, null);
  });

  it('4. resolve Yes clears action and marks txn REVIEWED', async () => {
    assert.ok(ctx);
    const action = await prisma.ownerAction.findFirst({
      where: { companyId: ctx.companyId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
    assert.ok(action);
    const result = await owner.resolveAction(
      ctx.userId,
      ctx.companyId,
      action!.id,
      APPROVAL_CHOICE_YES,
    );
    assert.equal(result.ok, true);
    const updated = await prisma.ownerAction.findUnique({ where: { id: action!.id } });
    assert.equal(updated?.status, 'RESOLVED');
    if (action!.bankTransactionId) {
      const txn = await prisma.bankTransaction.findUnique({
        where: { id: action!.bankTransactionId },
      });
      assert.equal(txn?.status, 'REVIEWED');
    }
  });

  it('5. Today pendingApprovalCount matches DB count', async () => {
    assert.ok(ctx);
    const dbCount = await prisma.ownerAction.count({
      where: { companyId: ctx.companyId, status: 'PENDING' },
    });
    const today = await owner.getToday(ctx.userId, ctx.companyId);
    assert.equal(today.pendingApprovalCount, dbCount);
  });

  it('6. getToday completes under 3s with 50 transactions', async () => {
    assert.ok(ctx);
    const batchId = `perf-${Date.now()}`;
    const rows = Array.from({ length: 50 }, (_, i) => ({
      bankAccountId: ctx!.bankAccountId,
      date: new Date(`2026-05-${String((i % 28) + 1).padStart(2, '0')}`),
      payee: `Perf Txn ${i}`,
      description: `Perf Txn ${i}`,
      spent: 10 + i,
      received: null as null,
      importBatchId: batchId,
      status: 'NEW' as const,
    }));
    await prisma.bankTransaction.createMany({ data: rows });
    const start = Date.now();
    await owner.getToday(ctx.userId, ctx.companyId);
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 3000, `getToday took ${elapsed}ms, expected < 3000ms`);
  });
});
