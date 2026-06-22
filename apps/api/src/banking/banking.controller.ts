import { Controller, Get, Post, Patch, Body, Param, Query, Headers } from '@nestjs/common';
import { BankingService } from './banking.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { User } from '@accounting/db';

@Controller('banking')
@Auth()
export class BankingController {
  constructor(private readonly service: BankingService) {}

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

  @Get('accounts/:accountId/transactions')
  listTransactions(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Param('accountId') accountId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Math.min(parseInt(limit, 10) || 0, 1000) : undefined;
    return this.service.listTransactions(
      user.id,
      companyId,
      accountId,
      status,
      parsedLimit && parsedLimit > 0 ? parsedLimit : undefined,
    );
  }

  @Post('accounts/:accountId/transactions')
  createTransaction(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Param('accountId') accountId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.createTransaction(user.id, companyId, accountId, body);
  }

  @Patch('transactions/:id')
  updateTransaction(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.updateTransaction(user.id, companyId, id, body);
  }

  @Post('transactions/mark-reviewed')
  markReviewed(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Body('ids') ids: string[],
  ) {
    return this.service.markReviewed(user.id, companyId, ids);
  }

  @Post('transactions/mark-reconciled')
  markReconciled(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Body('ids') ids: string[],
  ) {
    return this.service.markReconciled(user.id, companyId, ids);
  }

  @Post('accounts/:accountId/import')
  importCsv(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Param('accountId') accountId: string,
    @Body('rows') rows: Array<Record<string, string>>,
  ) {
    return this.service.importCsv(user.id, companyId, accountId, rows);
  }

  @Get('rules')
  listRules(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {
    return this.service.listRules(user.id, companyId);
  }

  @Post('rules')
  createRule(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.createRule(user.id, companyId, body);
  }
}
