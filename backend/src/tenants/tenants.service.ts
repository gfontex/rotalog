import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tenant.findMany({
      include: {
        branches: true,
        _count: {
          select: {
            users: true,
            vehicles: true,
            vehicleUsages: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  // Cria uma nova Empresa / Base Operacional vendida a um cliente
  async create(data: {
    name: string;
    cnpj?: string;
    adminName: string;
    adminCpf: string;
    adminEmail: string;
    adminPassword?: string;
  }) {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { name: data.name },
    });
    if (existingTenant) {
      throw new ConflictException(`A empresa "${data.name}" já está cadastrada.`);
    }

    const code = data.name.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Cria a Empresa (Tenant)
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        code,
        cnpj: data.cnpj || null,
        status: 'ACTIVE',
      },
    });

    // 2. Cria a Filial / Base Padrão
    const branch = await this.prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: `Base Central - ${data.name}`,
        city: 'Matriz',
        state: 'BR',
      },
    });

    // 3. Cria a conta de Administrador da nova Empresa
    const rawAdminPass = data.adminPassword || data.adminCpf;
    const passwordHash = await bcrypt.hash(rawAdminPass, 10);

    const adminUser = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        branchId: branch.id,
        name: data.adminName,
        cpf: data.adminCpf,
        email: data.adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });

    // 4. Cria checklist padrão para a nova empresa
    await this.prisma.checklistTemplate.create({
      data: {
        tenantId: tenant.id,
        name: `Checklist Padrão - ${data.name}`,
        items: JSON.stringify([
          { id: 'fuel', label: 'Nível de Combustível e Tanque' },
          { id: 'tires', label: 'Estado dos Pneus e Calibragem' },
          { id: 'bodywork', label: 'Lataria, Vidros e Avarias' },
          { id: 'lights', label: 'Faróis, Lanternas e Giroflex' },
          { id: 'docs', label: 'Documentação CRLV e Chave de Roda' },
        ]),
      },
    });

    return {
      tenant,
      admin: {
        id: adminUser.id,
        name: adminUser.name,
        cpf: adminUser.cpf,
        email: adminUser.email,
        role: adminUser.role,
        initialPassword: rawAdminPass,
      },
    };
  }

  async getBranches(tenantId?: string) {
    return this.prisma.branch.findMany({
      where: tenantId ? { tenantId } : {},
    });
  }
}
