import { config } from 'dotenv';

import { existsSync } from 'fs';

import { resolve } from 'path';

import { PrismaClient } from '@prisma/client';



for (const envPath of [

  resolve(process.cwd(), '.env'),

  resolve(process.cwd(), '../.env'),

  resolve(process.cwd(), '../../.env'),

]) {

  if (existsSync(envPath)) {

    config({ path: envPath });

    break;

  }

}



const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };



const prisma =

  globalForPrisma.prisma ??

  new PrismaClient({

    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],

  });



if (process.env.NODE_ENV !== 'production') {

  globalForPrisma.prisma = prisma;

}



export * from '@prisma/client';

export { prisma };


