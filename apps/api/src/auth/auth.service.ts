import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@accounting/db';

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  aud?: string;
  role?: string;
}

@Injectable()
export class AuthService {
  private get db() {
    return prisma;
  }

  constructor(private readonly jwt: JwtService) {}

  isSupabaseEnabled() {
    return Boolean(process.env.SUPABASE_JWT_SECRET);
  }

  async login(email: string, password: string) {
    const user = await this.db.user.findUnique({
      where: { email },
      include: {
        firm: true,
        memberships: { include: { company: true } },
      },
    });
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueLocalToken(user);
  }

  async loginWithSupabase(accessToken: string) {
    const payload = this.verifySupabaseToken(accessToken);
    const email = payload.email;
    if (!email) throw new UnauthorizedException('Invalid Supabase token');

    let user = await this.db.user.findFirst({
      where: {
        OR: [{ supabaseAuthId: payload.sub }, { email }],
      },
      include: {
        firm: true,
        memberships: { include: { company: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'No application profile found for this Supabase account. Contact your firm admin.',
      );
    }

    if (!user.supabaseAuthId) {
      user = await this.db.user.update({
        where: { id: user.id },
        data: { supabaseAuthId: payload.sub },
        include: {
          firm: true,
          memberships: { include: { company: true } },
        },
      });
    }

    return {
      token: accessToken,
      authProvider: 'supabase' as const,
      user: this.formatUser(user),
    };
  }

  verifySupabaseToken(token: string): SupabaseJwtPayload {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) throw new UnauthorizedException('Supabase auth not configured');
    try {
      const payload = this.jwt.verify(token, { secret }) as SupabaseJwtPayload;
      if (payload.role === 'anon') throw new UnauthorizedException();
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired Supabase token');
    }
  }

  async resolveUserFromToken(token: string) {
    if (this.isSupabaseEnabled()) {
      try {
        const payload = this.verifySupabaseToken(token);
        const user = await this.db.user.findFirst({
          where: {
            OR: [{ supabaseAuthId: payload.sub }, { email: payload.email ?? '' }],
          },
          include: { memberships: { include: { company: true } } },
        });
        if (user) return user;
      } catch {
        // fall through to local JWT
      }
    }

    const payload = this.jwt.verify(token, {
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    }) as { sub: string };

    const user = await this.db.user.findUnique({
      where: { id: payload.sub },
      include: { memberships: { include: { company: true } } },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async me(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        firm: true,
        memberships: { include: { company: true } },
      },
    });
    if (!user) throw new UnauthorizedException();
    return this.formatUser(user);
  }

  private issueLocalToken(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    firm: unknown;
    memberships: Array<{ company: unknown }>;
  }) {
    const token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      firmId: (user as { firmId?: string }).firmId,
      role: user.role,
    });
    return {
      token,
      authProvider: 'local' as const,
      user: this.formatUser(user),
    };
  }

  private formatUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    firm: unknown;
    memberships: Array<{ company: unknown }>;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      firm: user.firm,
      companies: user.memberships.map((m) => m.company),
    };
  }
}
