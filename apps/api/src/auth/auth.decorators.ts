import { Injectable, UseGuards, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@accounting/db';
import { JwtAuthGuard } from './jwt.strategy';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

export const CompanyId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.companyId ?? request.headers['x-company-id'];
});

export function Auth() {
  return UseGuards(JwtAuthGuard);
}
