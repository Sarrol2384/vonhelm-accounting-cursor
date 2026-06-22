import { Global, Injectable, Module } from '@nestjs/common';
import { PrismaClient, prisma } from '@accounting/db';

@Injectable()
export class PrismaService extends PrismaClient {}

@Global()
@Module({
  providers: [{ provide: PrismaService, useValue: prisma }],
  exports: [PrismaService],
})
export class PrismaModule {}
