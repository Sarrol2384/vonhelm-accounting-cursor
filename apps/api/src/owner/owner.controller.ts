import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';

import { IsString, MinLength } from 'class-validator';

import { User } from '@accounting/db';

import { Auth, CurrentUser } from '../auth/auth.decorators';

import { OwnerService } from './owner.service';



class ResolveActionDto {

  @IsString()

  @MinLength(1)

  choice!: string;

}



@Controller('owner')

@Auth()

export class OwnerController {

  constructor(private readonly service: OwnerService) {}



  @Get('health')

  health(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {

    return this.service.health(user.id, companyId);

  }



  @Get('today')

  today(@CurrentUser() user: User, @Headers('x-company-id') companyId: string) {

    return this.service.getToday(user.id, companyId);

  }



  @Post('actions/:id/resolve')

  resolveAction(

    @CurrentUser() user: User,

    @Headers('x-company-id') companyId: string,

    @Param('id') actionId: string,

    @Body() dto: ResolveActionDto,

  ) {

    return this.service.resolveAction(user.id, companyId, actionId, dto.choice);

  }

}


