import { Module } from '@nestjs/common';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';
import { AuditModule } from '../audit/audit.module';
import { OwnerModule } from '../owner/owner.module';

@Module({
  imports: [AuditModule, OwnerModule],
  controllers: [BankingController],
  providers: [BankingService],
})
export class BankingModule {}
