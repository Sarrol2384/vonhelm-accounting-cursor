import { Injectable } from '@nestjs/common';
import { prisma } from '@accounting/db';
import { assertCompanyAccess } from '../auth/jwt.strategy';

@Injectable()
export class NotesService {
  private readonly db = prisma

  constructor() {}

  async list(userId: string, companyId: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.note.findMany({
      where: { companyId },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }

  async create(userId: string, companyId: string, data: Record<string, unknown>) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.note.create({
      data: { companyId, userId, ...(data as object) } as never,
    });
  }

  async update(userId: string, companyId: string, id: string, data: Record<string, unknown>) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.note.update({ where: { id }, data: data as never });
  }

  async delete(userId: string, companyId: string, id: string) {
    await assertCompanyAccess(this.db, userId, companyId);
    return this.db.note.delete({ where: { id } });
  }
}
