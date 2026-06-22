import { Injectable } from '@nestjs/common';
import { prisma } from '@accounting/db';

@Injectable()
export class AuditService {
  private readonly db = prisma

  constructor() {}

  async log(
    companyId: string | null,
    userId: string | null,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.db.auditEvent.create({
      data: {
        companyId,
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata as never,
      },
    });
  }

  async list(companyId: string, limit = 100) {
    return this.db.auditEvent.findMany({
      where: { companyId },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
