import { Controller, Get, Patch, Param, Query, Body } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { User } from '@accounting/db';

@Controller('companies')
@Auth()
export class CompaniesController {
  constructor(private readonly service: CompaniesService) {}

  @Get('console')
  listConsole(
    @CurrentUser() user: User,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.service.listConsole(user.id, user.firmId, search, status);
  }

  @Get(':id')
  getOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.service.getOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.update(user.id, id, body);
  }
}
