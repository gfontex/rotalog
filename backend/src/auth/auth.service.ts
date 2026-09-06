import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { JwtPayload } from './jwt.strategy.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private generateTokens(user: { id: string; email: string; role: string; tenantId: string; branchId?: string | null }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      branchId: user.branchId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'rotalog_super_secret_jwt_key_2026_dev_env',
      expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET || 'rotalog_super_secret_refresh_key_2026_dev_env',
      expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as any,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(dto: RegisterDto) {
    // Verificar unicidade de email e CPF
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { cpf: dto.cpf }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Já existe um colaborador cadastrado com este e-mail ou CPF.');
    }

    // Se tenantId não foi fornecido, associa ao primeiro tenant ativo ou cria o padrão
    let tenantId = dto.tenantId;
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst({
        where: { status: 'ACTIVE' },
      });
      if (!defaultTenant) {
        const createdTenant = await this.prisma.tenant.create({
          data: {
            name: 'Empresa Piloto Transporte',
            status: 'ACTIVE',
          },
        });
        tenantId = createdTenant.id;
      } else {
        tenantId = defaultTenant.id;
      }
    }

    const passwordHash = await this.hashPassword(dto.password);

    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name,
        cpf: dto.cpf,
        email: dto.email.toLowerCase(),
        passwordHash,
        role: dto.role || 'DRIVER',
        tenantId,
        branchId: dto.branchId || null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        role: true,
        tenantId: true,
        branchId: true,
        isActive: true,
        createdAt: true,
      },
    });

    const tokens = this.generateTokens(newUser);

    return {
      user: newUser,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas. Verifique seu e-mail e senha.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Este colaborador está desativado. Entre em contato com o administrador.');
    }

    const isPasswordValid = await this.comparePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas. Verifique seu e-mail e senha.');
    }

    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        role: user.role,
        tenantId: user.tenantId,
        branchId: user.branchId,
        isActive: user.isActive,
      },
      ...tokens,
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET || 'rotalog_super_secret_refresh_key_2026_dev_env',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Sessão expirada ou colaborador desativado.');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        role: true,
        tenantId: true,
        branchId: true,
        isActive: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }
}
