import { Injectable } from '@nestjs/common';
import { prisma } from '@accounting/db';
import { assertCompanyAccess } from '../auth/jwt.strategy';

@Injectable()
export class TasksService {
  private readonly db = prisma

  constructor() {}

  async list(userId: string, companyId: string, filter?: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    const where: Record<string, unknown> = { companyId };
    if (filter === 'scheduled') {
      where.startDate = { lte: new Date() };
      where.status = { in: ['PENDING', 'IN_PROGRESS'] };
    }
    return this.db.task.findMany({
      where: where as never,
      include: { assignee: { select: { firstName: true, lastName: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  async create(userId: string, companyId: string, data: Record<string, unknown>) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.task.create({
      data: { companyId, assigneeId: userId, ...(data as object) } as never,
    });
  }

  async update(userId: string, companyId: string, id: string, data: Record<string, unknown>) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.task.update({ where: { id }, data: data as never });
  }
}
