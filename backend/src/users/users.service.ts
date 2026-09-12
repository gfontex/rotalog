import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId?: string) {
    return this.prisma.user.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        branch: true,
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateUserDto) {
    // 1. Verificar se ja existe colaborador com o mesmo CPF
    const existing = await this.prisma.user.findUnique({
      where: { cpf: dto.cpf },
    });

    if (existing) {
      throw new ConflictException(`Ja existe um colaborador cadastrado com o CPF ${dto.cpf}.`);
    }

    // 2. Se tenantId nao for enviado, vincula ao primeiro tenant disponivel (ex: MK Seguranca)
    let tenantId = dto.tenantId;
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst();
      if (!defaultTenant) {
        throw new NotFoundException('Nenhuma empresa cadastrada no banco. Crie uma empresa primeiro.');
      }
      tenantId = defaultTenant.id;
    }

    // 3. Regra de Negocio da Senha:
    // Se o gestor informar uma senha, utiliza-a. Caso contrario, a recomendacao padrao e o CPF do funcionario!
    const rawPassword = (dto.password && dto.password.trim().length > 0)
      ? dto.password.trim()
      : dto.cpf.trim();

    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // 4. Salvar fisicamente no banco de dados SQLite (rotalog.db)
    const newUser = await this.prisma.user.create({
      data: {
        tenantId,
        branchId: dto.branchId || null,
        name: dto.name,
        cpf: dto.cpf,
        email: dto.email,
        passwordHash,
        role: dto.role || 'DRIVER',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: {
        tenant: true,
      },
    });

    return {
      id: newUser.id,
      name: newUser.name,
      cpf: newUser.cpf,
      email: newUser.email,
      role: newUser.role,
      tenantId: newUser.tenantId,
      tenantName: newUser.tenant.name,
      initialPasswordAssigned: rawPassword === dto.cpf ? 'CPF do Colaborador (Padrao)' : 'Definida Manualmente',
    };
  }
}
