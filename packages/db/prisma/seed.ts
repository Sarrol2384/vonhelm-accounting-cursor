import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../.env') });

import {
  prisma,
  UserRole,
  CompanyStatus,
  AccountType,
  VatPeriodStatus,
  BankTransactionStatus,
  AlertSeverity,
  InvoiceStatus,
  BillStatus,
} from '../src/index';
import * as bcrypt from 'bcryptjs';

async function main() {
  await prisma.auditEvent.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.billLine.deleteMany();
  await prisma.taxInvoice.deleteMany();
  await prisma.supplierBill.deleteMany();
  await prisma.bankTransaction.deleteMany();
  await prisma.journalLine.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.vatReturn.deleteMany();
  await prisma.vatPeriod.deleteMany();
  await prisma.vatSetting.deleteMany();
  await prisma.bankRule.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.periodLock.deleteMany();
  await prisma.account.deleteMany();
  await prisma.item.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.companyMembership.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  await prisma.firm.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  const firm = await prisma.firm.create({
    data: { name: 'Demo Accounting Firm' },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@demo.co.za',
      passwordHash,
      firstName: 'Terry',
      lastName: 'Accountant',
      role: UserRole.FIRM_ADMIN,
      firmId: firm.id,
    },
  });

  const companies = await Promise.all([
    prisma.company.create({
      data: {
        firmId: firm.id,
        name: 'M and E Gelant (Pty) Ltd',
        tradingName: 'Klapmuts Pharmacy',
        vatRegistrationNumber: '4340305384',
        financialYearEndMonth: 2,
        financialYearEndDay: 28,
        vatFrequencyMonths: 2,
        phone: '0815586588',
        email: 'klapmutspharmacy@gmail.com',
        nextVatSubmissionDue: new Date('2026-07-31'),
        lastLoginAt: new Date('2026-06-18'),
        lastTransactionDate: new Date('2026-06-17'),
        status: CompanyStatus.ACTIVE,
      },
    }),
    prisma.company.create({
      data: {
        firmId: firm.id,
        name: 'Alex Jo Trading CC',
        registrationNumber: '2008/017888/23',
        vatRegistrationNumber: '4290306457',
        financialYearEndMonth: 2,
        financialYearEndDay: 28,
        nextVatSubmissionDue: new Date('2026-07-31'),
        lastLoginAt: new Date('2026-06-15'),
        lastTransactionDate: new Date('2026-06-10'),
        status: CompanyStatus.ACTIVE,
      },
    }),
    prisma.company.create({
      data: {
        firmId: firm.id,
        name: 'Supreme Pharmacist (Pty) Ltd',
        tradingName: 'E-Kem Pharmacy',
        vatRegistrationNumber: '4123456789',
        nextVatSubmissionDue: new Date('2027-01-31'),
        lastLoginAt: new Date('2026-06-19'),
        status: CompanyStatus.ACTIVE,
      },
    }),
    prisma.company.create({
      data: {
        firmId: firm.id,
        name: 'AF Johnson and Associates Inc',
        status: CompanyStatus.ACTIVE,
      },
    }),
  ]);

  for (const company of companies) {
    await prisma.companyMembership.create({
      data: { userId: admin.id, companyId: company.id },
    });
    await prisma.vatSetting.create({
      data: {
        companyId: company.id,
        standardRate: 15,
        frequencyMonths: 2,
        registrationNumber: company.vatRegistrationNumber,
      },
    });
  }

  const primary = companies[0];

  const accounts = await Promise.all([
    prisma.account.create({ data: { companyId: primary.id, code: '1000', name: 'Bank Current Account', type: AccountType.ASSET, isBankAccount: true } }),
    prisma.account.create({ data: { companyId: primary.id, code: '1100', name: 'Debtors Control', type: AccountType.ASSET } }),
    prisma.account.create({ data: { companyId: primary.id, code: '2000', name: 'Creditors Control', type: AccountType.LIABILITY } }),
    prisma.account.create({ data: { companyId: primary.id, code: '2200', name: 'VAT Control', type: AccountType.LIABILITY } }),
    prisma.account.create({ data: { companyId: primary.id, code: '3000', name: 'Retained Earnings', type: AccountType.EQUITY } }),
    prisma.account.create({ data: { companyId: primary.id, code: '4000', name: 'Sales', type: AccountType.INCOME } }),
    prisma.account.create({ data: { companyId: primary.id, code: '5000', name: 'Cost of Sales', type: AccountType.EXPENSE } }),
    prisma.account.create({ data: { companyId: primary.id, code: '6100', name: 'Rent', type: AccountType.EXPENSE } }),
    prisma.account.create({ data: { companyId: primary.id, code: '6200', name: 'Bank Charges', type: AccountType.EXPENSE } }),
  ]);

  const bankAccount = await prisma.bankAccount.create({
    data: {
      companyId: primary.id,
      name: 'Nedbank Current Account',
      bankName: 'Nedbank',
      accountNumber: '1234567890',
      openingBalance: 161740.42,
      glAccountId: accounts[0].id,
    },
  });

  await prisma.bankTransaction.createMany({
    data: [
      {
        bankAccountId: bankAccount.id,
        date: new Date('2026-06-18'),
        payee: 'Rent Office',
        description: 'Monthly rent',
        reference: 'RENT-06',
        spent: 15000,
        status: BankTransactionStatus.NEW,
        selectionId: accounts[7].id,
      },
      {
        bankAccountId: bankAccount.id,
        date: new Date('2026-06-17'),
        payee: 'Customer Payment',
        description: 'Invoice payment',
        reference: 'INV-1042',
        received: 8500,
        status: BankTransactionStatus.REVIEWED,
        selectionId: accounts[1].id,
      },
      {
        bankAccountId: bankAccount.id,
        date: new Date('2026-06-16'),
        payee: 'Nedbank',
        description: 'Service fee',
        reference: 'FEE-001',
        spent: 125.5,
        status: BankTransactionStatus.NEW,
        selectionId: accounts[8].id,
      },
    ],
  });

  await prisma.bankRule.create({
    data: {
      companyId: primary.id,
      name: 'Bank charges',
      matchText: 'service fee',
      accountId: accounts[8].id,
      vatCode: 'Exempt',
    },
  });

  const openPeriod = await prisma.vatPeriod.create({
    data: {
      companyId: primary.id,
      ref: '05/2026',
      periodStart: new Date('2026-04-01'),
      periodEnd: new Date('2026-05-31'),
      status: VatPeriodStatus.OPEN,
      vatPayable: 169726.38,
      submissionDue: new Date('2027-01-31'),
    },
  });

  await prisma.vatReturn.create({
    data: {
      vatPeriodId: openPeriod.id,
      field1: 1200000,
      field4: 180000,
      field12: 169726.38,
      field13: 169726.38,
    },
  });

  await prisma.vatPeriod.createMany({
    data: [
      {
        companyId: primary.id,
        ref: '03/2026',
        periodStart: new Date('2026-02-01'),
        periodEnd: new Date('2026-03-31'),
        status: VatPeriodStatus.CLOSED,
        vatPayable: 142350.0,
        submissionDue: new Date('2026-05-31'),
      },
      {
        companyId: primary.id,
        ref: '01/2026',
        periodStart: new Date('2025-12-01'),
        periodEnd: new Date('2026-01-31'),
        status: VatPeriodStatus.CLOSED,
        vatPayable: 98500.0,
      },
    ],
  });

  const customer = await prisma.customer.create({
    data: {
      companyId: primary.id,
      name: 'City Health Clinic',
      email: 'accounts@cityhealth.co.za',
      phone: '0215551234',
    },
  });

  const supplier = await prisma.supplier.create({
    data: {
      companyId: primary.id,
      name: 'Pharma Distributors SA',
      email: 'billing@pharmadist.co.za',
    },
  });

  await prisma.item.create({
    data: {
      companyId: primary.id,
      code: 'MED-001',
      description: 'Generic Medicine Pack',
      unitPrice: 250,
    },
  });

  await prisma.taxInvoice.create({
    data: {
      companyId: primary.id,
      customerId: customer.id,
      number: 'INV-2026-001',
      date: new Date('2026-06-01'),
      dueDate: new Date('2026-06-30'),
      status: InvoiceStatus.SENT,
      subtotal: 10000,
      vatAmount: 1500,
      total: 11500,
      lines: {
        create: [
          { description: 'Medical supplies', quantity: 40, unitPrice: 250, lineTotal: 10000 },
        ],
      },
    },
  });

  await prisma.supplierBill.create({
    data: {
      companyId: primary.id,
      supplierId: supplier.id,
      number: 'BILL-2026-042',
      date: new Date('2026-06-05'),
      dueDate: new Date('2026-07-05'),
      status: BillStatus.RECEIVED,
      subtotal: 5000,
      vatAmount: 750,
      total: 5750,
      lines: {
        create: [
          { description: 'Stock delivery', quantity: 1, unitPrice: 5000, lineTotal: 5000 },
        ],
      },
    },
  });

  await prisma.note.create({
    data: {
      companyId: primary.id,
      userId: admin.id,
      type: 'Compliance',
      subject: 'VAT 201 review before submission',
      dueDate: new Date('2026-07-15'),
    },
  });

  await prisma.task.create({
    data: {
      companyId: primary.id,
      assigneeId: admin.id,
      title: 'Reconcile Nedbank account',
      status: 'PENDING',
      startDate: new Date('2026-06-19'),
      dueDate: new Date('2026-06-25'),
    },
  });

  for (const company of companies) {
    const alertCount = company.name.includes('AF Johnson') ? 5 : company.name.includes('Alex') ? 2 : 1;
    for (let i = 0; i < alertCount; i++) {
      await prisma.alert.create({
        data: {
          companyId: company.id,
          title: i === 0 ? 'VAT submission approaching' : `Compliance item ${i + 1}`,
          severity: i === 0 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
          link: '/vat',
        },
      });
    }
  }

  console.log('Seed complete');
  console.log('Login: admin@demo.co.za / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
