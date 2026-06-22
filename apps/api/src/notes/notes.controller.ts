import { Controller, Get, Post, Patch, Delete, Body, Param, Headers } from '@nestjs/common';
import { NotesService } from './notes.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { User } from '@accounting/db';

@Controller('notes')
@Auth()
export class NotesController {
  constructor(private readonly service: NotesService) {}

  @Get()
  list(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {
    return this.service.list(user.id, companyId);
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

  @Delete(':id')
  delete(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.service.delete(user.id, companyId, id);
  }
}
