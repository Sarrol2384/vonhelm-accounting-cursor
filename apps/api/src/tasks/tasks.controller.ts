import { Controller, Get, Post, Patch, Body, Param, Query, Headers } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { User } from '@accounting/db';

@Controller('tasks')
@Auth()
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Get()
  list(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Query('filter') filter?: string,
  ) {
    return this.service.list(user.id, companyId, filter);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.create(user.id, companyId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.update(user.id, companyId, id, body);
  }
}
