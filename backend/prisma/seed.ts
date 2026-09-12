import { PrismaClient, Role, VehicleStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados ROTALOG...');

  // 1. Criar ou obter Tenant
  let tenant = await prisma.tenant.findFirst({
    where: { name: 'Empresa Piloto Transporte S/A' },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Empresa Piloto Transporte S/A',
        cnpj: '12.345.678/0001-90',
        status: 'ACTIVE',
      },
    });
    console.log(`✅ Tenant criado: ${tenant.name} (${tenant.id})`);
  }

  // 2. Criar ou obter Filial
  let branch = await prisma.branch.findFirst({
    where: { tenantId: tenant.id, name: 'Matriz São Paulo' },
  });

  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        tenantId: tenant.id,
        name: 'Matriz São Paulo',
        city: 'São Paulo',
        state: 'SP',
      },
    });
    console.log(`✅ Filial criada: ${branch.name}`);
  }

  // 3. Criar os 4 Perfis de Usuário Base
  const salt = await bcrypt.genSalt(10);
  const defaultUsers = [
    {
      name: 'Administrador do Sistema',
      cpf: '000.111.222-33',
      email: 'admin@rotalog.com',
      password: await bcrypt.hash('admin123', salt),
      role: Role.ADMIN,
    },
    {
      name: 'Carlos - Gestor de Frota',
      cpf: '111.222.333-44',
      email: 'gestor@rotalog.com',
      password: await bcrypt.hash('gestor123', salt),
      role: Role.FLEET_MANAGER,
    },
    {
      name: 'Mariana - Analista de RH',
      cpf: '222.333.444-55',
      email: 'rh@rotalog.com',
      password: await bcrypt.hash('rh123', salt),
      role: Role.HR,
    },
    {
      name: 'João Silva - Motorista',
      cpf: '333.444.555-66',
      email: 'motorista@rotalog.com',
      password: await bcrypt.hash('motorista123', salt),
      role: Role.DRIVER,
    },
  ];

  for (const u of defaultUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: u.email },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          name: u.name,
          cpf: u.cpf,
          email: u.email,
          passwordHash: u.password,
          role: u.role,
          isActive: true,
        },
      });
      console.log(`👤 Usuário [${u.role}] criado: ${u.email}`);
    }
  }

  // 4. Criar os 3 Veículos Piloto
  const defaultVehicles = [
    {
      plate: 'BRA2E19',
      brand: 'Fiat',
      model: 'Strada Freedom 1.3',
      year: 2023,
      status: VehicleStatus.AVAILABLE,
      currentMileage: 35400,
    },
    {
      plate: 'RTL9A88',
      brand: 'Volkswagen',
      model: 'Gol 1.0 MPI',
      year: 2022,
      status: VehicleStatus.AVAILABLE,
      currentMileage: 58120,
    },
    {
      plate: 'LOG4F33',
      brand: 'Chevrolet',
      model: 'Onix Plus Premier',
      year: 2024,
      status: VehicleStatus.AVAILABLE,
      currentMileage: 12800,
    },
  ];

  for (const v of defaultVehicles) {
    const existing = await prisma.vehicle.findUnique({
      where: { plate: v.plate },
    });

    if (!existing) {
      await prisma.vehicle.create({
        data: {
          tenantId: tenant.id,
          branchId: branch.id,
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          year: v.year,
          status: v.status,
          currentMileage: v.currentMileage,
        },
      });
      console.log(`🚗 Veículo cadastrado: ${v.plate} - ${v.brand} ${v.model}`);
    }
  }

  // 5. Criar Template Padrão de Checklist
  const existingTemplate = await prisma.checklistTemplate.findFirst({
    where: { tenantId: tenant.id, name: 'Checklist Veicular Padrão ROTALOG' },
  });

  if (!existingTemplate) {
    await prisma.checklistTemplate.create({
      data: {
        tenantId: tenant.id,
        name: 'Checklist Veicular Padrão ROTALOG',
        items: [
          { key: 'combustivel', label: 'Nível de Combustível', required: true },
          { key: 'pneus', label: 'Calibragem e Estado dos Pneus', required: true },
          { key: 'documentacao', label: 'Documentação do Veículo (CRLV)', required: true },
          { key: 'avarias', label: 'Avarias / Lataria / Amassados', required: true },
          { key: 'limpeza', label: 'Limpeza Interna e Externa', required: false },
          { key: 'iluminacao', label: 'Faróis, Lanternas e Setas', required: true },
        ],
        isActive: true,
      },
    });
    console.log('📋 Template de checklist veicular criado.');
  }

  // 6. Criar Empresa MK Segurança solicitada pelo usuário
  let mkTenant = await prisma.tenant.findFirst({
    where: { name: 'MK Segurança' },
  });

  if (!mkTenant) {
    mkTenant = await prisma.tenant.create({
      data: {
        name: 'MK Segurança',
        cnpj: '23.456.789/0001-01',
        status: 'ACTIVE',
      },
    });
    console.log(`🛡️ Empresa criada: ${mkTenant.name} (${mkTenant.id})`);
  }

  let mkBranch = await prisma.branch.findFirst({
    where: { tenantId: mkTenant.id, name: 'Base Operacional Principal' },
  });

  if (!mkBranch) {
    mkBranch = await prisma.branch.create({
      data: {
        tenantId: mkTenant.id,
        name: 'Base Operacional Principal',
        city: 'São Paulo',
        state: 'SP',
      },
    });
  }

  // Administrador Geral MK Segurança com CPF 13993248708 e senha padrão CPF
  const mkAdminCpf = '139.932.487-08';
  const existingMkAdmin = await prisma.user.findFirst({
    where: {
      OR: [{ cpf: mkAdminCpf }, { cpf: '13993248708' }, { email: 'admin@mkseguranca.com.br' }],
    },
  });

  if (!existingMkAdmin) {
    const adminUser = await prisma.user.create({
      data: {
        tenantId: mkTenant.id,
        branchId: mkBranch.id,
        name: 'Administrador MK Segurança',
        cpf: mkAdminCpf,
        email: 'admin@mkseguranca.com.br',
        passwordHash: await bcrypt.hash('13993248708', salt),
        role: Role.ADMIN,
        isActive: true,
      },
    });
    console.log(`👑 Administrador MK Segurança criado: CPF ${mkAdminCpf} | Senha: CPF`);
  }

  // Veículos da frota MK Segurança
  const mkVehicles = [
    { plate: 'MKF1A01', brand: 'Renault', model: 'Kangoo 1.6 Maxi', year: 2023, currentMileage: 32400 },
    { plate: 'MKS2B02', brand: 'Fiat', model: 'Strada Freedom', year: 2024, currentMileage: 18900 },
    { plate: 'MKG3C03', brand: 'Volkswagen', model: 'Gol 1.0 City', year: 2022, currentMileage: 49200 },
  ];

  for (const v of mkVehicles) {
    const ex = await prisma.vehicle.findUnique({ where: { plate: v.plate } });
    if (!ex) {
      await prisma.vehicle.create({
        data: {
          tenantId: mkTenant.id,
          branchId: mkBranch.id,
          plate: v.plate,
          brand: v.brand,
          model: v.model,
          year: v.year,
          status: VehicleStatus.AVAILABLE,
          currentMileage: v.currentMileage,
        },
      });
      console.log(`🚗 Veículo MK cadastrado: ${v.plate} - ${v.brand} ${v.model}`);
    }
  }

  console.log('✨ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
