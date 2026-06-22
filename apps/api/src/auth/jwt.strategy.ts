import { Injectable, UnauthorizedException, ForbiddenException, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaClient } from '@accounting/db';
import { AuthService } from './auth.service';

export async function assertCompanyAccess(
  db: PrismaClient,
  userId: string,
  companyId: string,
) {
  const membership = await db.companyMembership.findUnique({
    where: { userId_companyId: { userId, companyId } },
  });
  if (!membership) throw new ForbiddenException('No access to this company');
  return membership;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization as string | undefined;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = authHeader.slice(7);
    request.user = await this.authService.resolveUserFromToken(token);
    return true;
  }
}
