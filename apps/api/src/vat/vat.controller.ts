import { Controller, Get, Post, Param, Body, Headers } from '@nestjs/common';
import { VatService } from './vat.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { User } from '@accounting/db';

@Controller('vat')
@Auth()
export class VatController {
  constructor(private readonly service: VatService) {}

  @Get('settings')
  getSettings(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {
    return this.service.getSettings(user.id, companyId);
  }

  @Get('periods')
  listPeriods(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {
    return this.service.listPeriods(user.id, companyId);
  }

  @Post('periods/:id/calculate')
  calculate(@CurrentUser() user: User, @Headers('x-company-id') companyId: string, @Param('id') id: string) {
    return this.service.calculateVat201(user.id, companyId, id);
  }

  @Post('periods/:id/close')
  closePeriod(@CurrentUser() user: User, @Headers('x-company-id') companyId: string, @Param('id') id: string) {
    return this.service.closePeriod(user.id, companyId, id);
  }

  @Post('periods/:id/submit')
  markSubmitted(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Param('id') id: string,
    @Body('submittedAt') submittedAt?: string,
  ) {
    return this.service.markSubmitted(user.id, companyId, id, submittedAt);
  }

  @Post('periods/:id/link-payment')
  linkPayment(@CurrentUser() user: User, @Headers('x-company-id') companyId: string, @Param('id') id: string) {
    return this.service.linkPayment(user.id, companyId, id);
  }

  @Post('periods/:id/reopen')
  reopen(@CurrentUser() user: User, @Headers('x-company-id') companyId: string, @Param('id') id: string) {
    return this.service.reopenPeriod(user.id, companyId, id);
  }
}
