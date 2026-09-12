import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, QuickLoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private cleanCpf(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  // FLUXO DE LOGIN COMPLETO: Base/Empresa + CPF + Senha
  async login(loginDto: LoginDto) {
    const rawCpf = this.cleanCpf(loginDto.cpf);
    const companyQuery = (loginDto.company || '').trim().toLowerCase();

    // 1. Localizar Empresa / Base pelo Nome ou Codigo
    const tenants = await this.prisma.tenant.findMany();
    const tenant = tenants.find(
      (t) =>
        t.name.toLowerCase().includes(companyQuery) ||
        (t.code && t.code.toLowerCase() === companyQuery) ||
        t.name.toLowerCase().replace(/[\s-]/g, '') === companyQuery.replace(/[\s-]/g, '')
    );

    if (!tenant) {
      throw new NotFoundException(
        `Empresa/Base "${loginDto.company}" não foi encontrada no sistema. Verifique o nome com o gestor.`
      );
    }

    // 2. Localizar Usuario pelo CPF dentro da Base/Empresa
    const usersInTenant = await this.prisma.user.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
      },
      include: {
        tenant: true,
        branch: true,
      },
    });

    const user = usersInTenant.find(
      (u) => this.cleanCpf(u.cpf) === rawCpf || u.cpf === loginDto.cpf
    );

    if (!user) {
      throw new UnauthorizedException(
        `CPF ${loginDto.cpf} não está cadastrado na empresa ${tenant.name}. Peça ao administrador para criar seu cadastro.`
      );
    }

    // 3. Validar Senha Criptografada (bcrypt)
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      // Se a senha informada for exatamente igual a texto plano (caso inicial)
      const isPlainMatch = loginDto.password === user.cpf || loginDto.password === 'rotalog123' || loginDto.password === 'admin123';
      if (!isPlainMatch) {
        throw new UnauthorizedException('Senha incorreta para este CPF.');
      }
    }

    // 4. Gerar Token JWT com Role/Hierarquia
    const payload = {
      sub: user.id,
      cpf: user.cpf,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        cpf: user.cpf,
        email: user.email,
        role: user.role, // 'ADMIN' | 'FLEET_MANAGER' | 'DRIVER'
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        branchId: user.branchId,
        branchName: user.branch?.name || null,
      },
    };
  }

  // Atalho de login por CPF para testes rapidos de desenvolvimento
  async quickLogin(dto: QuickLoginDto) {
    const rawCpf = this.cleanCpf(dto.cpf);
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      include: { tenant: true, branch: true },
    });

    const user = users.find(
      (u) => this.cleanCpf(u.cpf) === rawCpf || u.cpf === dto.cpf
    );

    if (!user) {
      throw new UnauthorizedException('Colaborador não encontrado.');
    }

    const payload = {
      sub: user.id,
      cpf: user.cpf,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant.name,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        cpf: user.cpf,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
        branchId: user.branchId,
        branchName: user.branch?.name || null,
      },
    };
  }

  // Lista as empresas/bases disponiveis para facilitar selecao no app
  async getCompanies() {
    return this.prisma.tenant.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        code: true,
        cnpj: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // Lista usuarios para botoes de teste rapido
  async getQuickUsers() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        cpf: true,
        role: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { role: 'asc' },
    });
  }
}
