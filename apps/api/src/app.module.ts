import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { BankingModule } from './banking/banking.module';
import { LedgerModule } from './ledger/ledger.module';
import { VatModule } from './vat/vat.module';
import { SalesModule } from './sales/sales.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotesModule } from './notes/notes.module';
import { TasksModule } from './tasks/tasks.module';
import { AuditModule } from './audit/audit.module';
import { StorageModule } from './storage/storage.module';
import { OwnerModule } from './owner/owner.module';

@Module({
  controllers: [AppController],
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '7d' },
    }),
    AuthModule,
    CompaniesModule,
    BankingModule,
    LedgerModule,
    VatModule,
    SalesModule,
    ReportsModule,
    DashboardModule,
    NotesModule,
    TasksModule,
    AuditModule,
    StorageModule,
    OwnerModule,
  ],
})
export class AppModule {}
