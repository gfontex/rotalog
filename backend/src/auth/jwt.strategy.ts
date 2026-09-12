import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'rotalog-super-secret-jwt-key-change-in-prod-2025',
    });
  }

  async validate(payload: { sub: string; cpf: string; role: string; tenantId: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { tenant: true, branch: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário não autorizado ou inativo');
    }

    return user;
  }
}
