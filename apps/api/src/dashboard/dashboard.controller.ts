import { Controller, Get, Query, Headers } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { User } from '@accounting/db';

@Controller('dashboard')
@Auth()
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('kpis')
  getKpis(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {
    return this.service.getKpis(user.id, companyId);
  }

  @Get('search')
  search(@CurrentUser() user: User, @Query('q') q: string) {
    return this.service.search(user.id, user.firmId, q ?? '');
  }
}
