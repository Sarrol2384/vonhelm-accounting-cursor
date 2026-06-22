import { Controller, Get, Post, Body, Query, Headers, Param } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { User } from '@accounting/db';

@Controller('ledger')
@Auth()
export class LedgerController {
  constructor(private readonly service: LedgerService) {}

  @Get('accounts')
  listAccounts(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {
    return this.service.listAccounts(user.id, companyId);
  }

  @Post('accounts')
  createAccount(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.createAccount(user.id, companyId, body);
  }

  @Get('journals')
  listJournals(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {
    return this.service.listJournals(user.id, companyId);
  }

  @Post('journals')
  createJournal(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Body() body: Parameters<LedgerService['createJournal']>[2],
  ) {
    return this.service.createJournal(user.id, companyId, body);
  }

  @Post('journals/:id/post')
  postJournal(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.postJournal(user.id, companyId, id);
  }

  @Get('trial-balance')
  trialBalance(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Query('asOf') asOf?: string,
  ) {
    return this.service.trialBalance(user.id, companyId, asOf);
  }

  @Post('period-lock')
  lockPeriod(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Body('lockDate') lockDate: string,
  ) {
    return this.service.lockPeriod(user.id, companyId, lockDate);
  }

  @Get('period-locks')
  listPeriodLocks(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {
    return this.service.listPeriodLocks(user.id, companyId);
  }
}
