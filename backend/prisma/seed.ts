import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function main() {
  console.log('Populando banco de dados persistente SQLite (rotalog.db)...');

  // Limpa registros anteriores para seed limpo se existirem
  await prisma.auditLog.deleteMany();
  await prisma.timeClocking.deleteMany();
  await prisma.vehicleUsage.deleteMany();
  await prisma.vehicleChecklist.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.tenant.deleteMany();

  // 1. Criar Empresa / Base: "MK Seguranca"
  const tenantMK = await prisma.tenant.create({
    data: {
      name: 'MK Seguranca',
      code: 'mkseguranca',
      cnpj: '12.345.678/0001-90',
      status: 'ACTIVE',
    },
  });
  console.log('Empresa criada no banco:', tenantMK.name);

  // Filial / Base Operacional
  const branchMK = await prisma.branch.create({
    data: {
      tenantId: tenantMK.id,
      name: 'Base Operacional Central',
      city: 'Sao Paulo',
      state: 'SP',
    },
  });

  // 2. Criar Usuarios com as 3 Hierarquias e Senhas Criptografadas com bcrypt
  // Hierarquia 1: ADMIN (Administrador Master que cadastra funcionarios e viaturas)
  const hashAdmin = await bcrypt.hash('admin123', 10);
  const userAdmin = await prisma.user.create({
    data: {
      tenantId: tenantMK.id,
      branchId: branchMK.id,
      name: 'Admin MK Seguranca',
      cpf: '000.111.222-33',
      email: 'admin@mkseguranca.com.br',
      passwordHash: hashAdmin,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Hierarquia 2: FLEET_MANAGER (Gestor de Rotas e Controle de Frota)
  const hashManager = await bcrypt.hash('333.444.555-66', 10); // Recomendacao: senha inicial e o proprio CPF
  const userManager = await prisma.user.create({
    data: {
      tenantId: tenantMK.id,
      branchId: branchMK.id,
      name: 'Roberto Santos',
      cpf: '333.444.555-66',
      email: 'roberto.santos@mkseguranca.com.br',
      passwordHash: hashManager,
      role: 'FLEET_MANAGER',
      isActive: true,
    },
  });

  // Hierarquia 3: DRIVER (Motoristas Operacionais)
  const hashDriver1 = await bcrypt.hash('111.222.333-44', 10); // Senha = CPF
  const userDriver1 = await prisma.user.create({
    data: {
      tenantId: tenantMK.id,
      branchId: branchMK.id,
      name: 'Carlos Silva',
      cpf: '111.222.333-44',
      email: 'carlos.silva@mkseguranca.com.br',
      passwordHash: hashDriver1,
      role: 'DRIVER',
      isActive: true,
    },
  });

  const hashDriver2 = await bcrypt.hash('222.333.444-55', 10); // Senha = CPF
  const userDriver2 = await prisma.user.create({
    data: {
      tenantId: tenantMK.id,
      branchId: branchMK.id,
      name: 'Joao Pereira',
      cpf: '222.333.444-55',
      email: 'joao.pereira@mkseguranca.com.br',
      passwordHash: hashDriver2,
      role: 'DRIVER',
      isActive: true,
    },
  });
  console.log('Usuarios e credenciais das 3 hierarquias gravados no banco.');

  // 3. Criar Veiculos da Frota da MK Seguranca
  const veh1 = await prisma.vehicle.create({
    data: {
      tenantId: tenantMK.id,
      branchId: branchMK.id,
      plate: 'MKS1A01',
      brand: 'Fiat',
      model: 'Strada Freedom 1.3',
      year: 2023,
      status: 'AVAILABLE', // Disponivel -> Motorista consegue clicar e iniciar rota
      currentMileage: 45200,
    },
  });

  const veh2 = await prisma.vehicle.create({
    data: {
      tenantId: tenantMK.id,
      branchId: branchMK.id,
      plate: 'MKS2B02',
      brand: 'Toyota',
      model: 'Hilux CD 4x4 Power',
      year: 2022,
      status: 'AVAILABLE', // Disponivel -> Motorista consegue clicar e iniciar rota
      currentMileage: 82150,
    },
  });

  const veh3 = await prisma.vehicle.create({
    data: {
      tenantId: tenantMK.id,
      branchId: branchMK.id,
      plate: 'MKS3C03',
      brand: 'Renault',
      model: 'Duster Tatica 4x4',
      year: 2023,
      status: 'IN_USE', // Em Uso -> Aparece em cinza e irclicavel para o motorista
      currentMileage: 114300,
    },
  });

  const veh4 = await prisma.vehicle.create({
    data: {
      tenantId: tenantMK.id,
      branchId: branchMK.id,
      plate: 'MKS4D04',
      brand: 'Volkswagen',
      model: 'Gol Patrulha 1.6',
      year: 2021,
      status: 'MAINTENANCE', // Manutencao/Oficina -> Aparece em cinza e irclicavel
      currentMileage: 63800,
    },
  });
  console.log('Veiculos da frota cadastrados com status.');

  // 4. Template Padrao de Checklist
  await prisma.checklistTemplate.create({
    data: {
      tenantId: tenantMK.id,
      name: 'Checklist Operacional MK Seguranca',
      items: JSON.stringify([
        { id: 'fuel', label: 'Nivel de Combustivel e Tanque' },
        { id: 'tires', label: 'Estado dos Pneus e Calibragem' },
        { id: 'bodywork', label: 'Lataria, Vidros e Avarias' },
        { id: 'lights', label: 'Farois, Lanternas e Giroflex' },
        { id: 'docs', label: 'Documentacao CRLV e Chave de Roda' },
      ]),
    },
  });

  // 5. Viagem de Exemplo Concluida para o Motorista Carlos Silva
  // (Assim ele ja visualiza seu historico do Dia 1 com almoco e consideracoes)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(8, 0, 0, 0);

  const lunchStart = new Date(yesterday);
  lunchStart.setHours(12, 0, 0, 0);

  const lunchEnd = new Date(yesterday);
  lunchEnd.setHours(13, 0, 0, 0);

  const endTrip = new Date(yesterday);
  endTrip.setHours(17, 30, 0, 0);

  const chkEntry = await prisma.vehicleChecklist.create({
    data: {
      tenantId: tenantMK.id,
      vehicleId: veh1.id,
      driverId: userDriver1.id,
      type: 'ENTRY',
      mileage: 45050,
      itemsResult: JSON.stringify({
        fuel: { ok: true },
        tires: { ok: true },
        bodywork: { ok: true },
        lights: { ok: true },
        docs: { ok: true },
      }),
      observation: 'Viatura liberada no patio em perfeito estado.',
      hasProblem: false,
      createdAt: yesterday,
    },
  });

  const chkExit = await prisma.vehicleChecklist.create({
    data: {
      tenantId: tenantMK.id,
      vehicleId: veh1.id,
      driverId: userDriver1.id,
      type: 'EXIT',
      mileage: 45200,
      itemsResult: JSON.stringify({
        fuel: { ok: true },
        tires: { ok: true },
        bodywork: { ok: true },
        lights: { ok: true },
        docs: { ok: true },
      }),
      observation: 'Devolucao regular sem ocorrencias operacionais.',
      hasProblem: false,
      createdAt: endTrip,
    },
  });

  await prisma.vehicleUsage.create({
    data: {
      tenantId: tenantMK.id,
      vehicleId: veh1.id,
      driverId: userDriver1.id,
      entryChecklistId: chkEntry.id,
      exitChecklistId: chkExit.id,
      startTime: yesterday,
      endTime: endTrip,
      lunchStartTime: lunchStart,
      lunchEndTime: lunchEnd,
      totalLunchMinutes: 60,
      totalDurationMinutes: 510,
      totalDistanceKm: 150,
      status: 'COMPLETED',
      createdAt: yesterday,
    },
  });

  // 6. Notificacao de exemplo
  await prisma.auditLog.create({
    data: {
      tenantId: tenantMK.id,
      userId: userAdmin.id,
      action: 'INICIO_ROTA',
      entityType: 'SYSTEM',
      entityId: 'system',
      details: JSON.stringify({
        message: 'Base MK Seguranca inicializada com sucesso no banco de dados.',
      }),
      timestamp: new Date(),
    },
  });

  console.log('Seed do banco rotalog.db concluido com sucesso!');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
