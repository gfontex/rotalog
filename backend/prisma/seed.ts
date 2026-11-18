// Populacao inicial do banco de dados (empresa Teste Apresentação, funcionarios, veiculos e historicos)

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function main() {
  console.log('Limpando banco de dados e populando base ficticia "Teste Apresentação"...');

  // Limpa todos os registros anteriores
  await prisma.auditLog.deleteMany();
  await prisma.timeClocking.deleteMany();
  await prisma.vehicleUsage.deleteMany();
  await prisma.vehicleChecklist.deleteMany();
  await prisma.checklistTemplate.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.tenant.deleteMany();

  // 1. Criar Empresa: "Teste Apresentação"
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Teste Apresentação',
      code: 'teste-apresentacao',
      cnpj: '45.123.789/0001-10',
      status: 'ACTIVE',
    },
  });
  console.log('Empresa criada:', tenant.name);

  // Filial Operacional
  const branch = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'Matriz Operacional - São Paulo',
      city: 'São Paulo',
      state: 'SP',
    },
  });

  // 2. Criar Funcionarios Ficticios (Senha padrao: 123456)
  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  // Hierarquia 1: ADMIN (Representante Legal da Empresa)
  const userAdmin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Ricardo Almeida (Representante Legal)',
      cpf: '111.111.111-11',
      email: 'ricardo.almeida@testeapresentacao.com.br',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  // Hierarquia 2: FLEET_MANAGER (Gestores de Frota)
  const userManager1 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Roberto Mendes (Gestor de Frota)',
      cpf: '222.222.222-22',
      email: 'roberto.mendes@testeapresentacao.com.br',
      passwordHash: defaultPasswordHash,
      role: 'FLEET_MANAGER',
      isActive: true,
    },
  });

  const userManager2 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Fernanda Costa (Gestora Operacional)',
      cpf: '222.333.444-55',
      email: 'fernanda.costa@testeapresentacao.com.br',
      passwordHash: defaultPasswordHash,
      role: 'FLEET_MANAGER',
      isActive: true,
    },
  });

  // Hierarquia 3: DRIVER (Motoristas Operacionais)
  const driver1 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Carlos Eduardo Silva',
      cpf: '333.333.333-33',
      email: 'carlos.silva@testeapresentacao.com.br',
      passwordHash: defaultPasswordHash,
      role: 'DRIVER',
      isActive: true,
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Marcos Vinícius Oliveira',
      cpf: '444.444.444-44',
      email: 'marcos.oliveira@testeapresentacao.com.br',
      passwordHash: defaultPasswordHash,
      role: 'DRIVER',
      isActive: true,
    },
  });

  const driver3 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Lucas Gabriel Pereira',
      cpf: '555.555.555-55',
      email: 'lucas.pereira@testeapresentacao.com.br',
      passwordHash: defaultPasswordHash,
      role: 'DRIVER',
      isActive: true,
    },
  });

  const driver4 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'André Luiz Souza',
      cpf: '666.666.666-66',
      email: 'andre.souza@testeapresentacao.com.br',
      passwordHash: defaultPasswordHash,
      role: 'DRIVER',
      isActive: true,
    },
  });

  console.log('Funcionários criados: 1 Admin, 2 Gestores, 4 Motoristas.');

  // 3. Criar Veiculos Ficticios da Frota
  const veh1 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      plate: 'TAP1A01',
      brand: 'Fiat',
      model: 'Strada Freedom 1.3',
      year: 2024,
      status: 'AVAILABLE',
      currentMileage: 18450,
    },
  });

  const veh2 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      plate: 'TAP2B02',
      brand: 'Toyota',
      model: 'Hilux CD SRX 4x4',
      year: 2023,
      status: 'AVAILABLE',
      currentMileage: 54200,
    },
  });

  const veh3 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      plate: 'TAP3C03',
      brand: 'Volkswagen',
      model: 'Saveiro Robust 1.6',
      year: 2024,
      status: 'AVAILABLE',
      currentMileage: 12300,
    },
  });

  const veh4 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      plate: 'TAP4D04',
      brand: 'Renault',
      model: 'Duster Iconic 1.6',
      year: 2023,
      status: 'IN_USE',
      currentMileage: 41890,
    },
  });

  const veh5 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      plate: 'TAP5E05',
      brand: 'Chevrolet',
      model: 'Montana LTZ 1.2',
      year: 2024,
      status: 'MAINTENANCE',
      currentMileage: 29750,
    },
  });

  const veh6 = await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      plate: 'TAP6F06',
      brand: 'Fiat',
      model: 'Fiorino Endurance 1.4',
      year: 2022,
      status: 'AVAILABLE',
      currentMileage: 67400,
    },
  });

  console.log('6 Veículos fictícios criados.');

  // 4. Template Padrao de Checklist
  await prisma.checklistTemplate.create({
    data: {
      tenantId: tenant.id,
      name: 'Checklist Padrão - Teste Apresentação',
      items: JSON.stringify([
        { id: 'fuel', label: 'Nível de Combustível e Tanque' },
        { id: 'tires', label: 'Estado dos Pneus e Calibragem' },
        { id: 'bodywork', label: 'Lataria, Vidros e Pintura' },
        { id: 'lights', label: 'Faróis, Lanternas e Setas' },
        { id: 'docs', label: 'Documentação CRLV e Kit de Emergência' },
      ]),
    },
  });

  // Helper de datas relativas
  const makeDate = (daysAgo: number, hour: number, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  // 5. Viagens Concluidas + Checklists
  // Viagem 1: Carlos Eduardo Silva (veh1 - 3 dias atrás)
  const v1Start = makeDate(3, 8, 5);
  const v1LunchStart = makeDate(3, 12, 0);
  const v1LunchEnd = makeDate(3, 13, 0);
  const v1End = makeDate(3, 17, 40);

  const chk1In = await prisma.vehicleChecklist.create({
    data: {
      tenantId: tenant.id,
      vehicleId: veh1.id,
      driverId: driver1.id,
      type: 'ENTRY',
      mileage: 18310,
      itemsResult: JSON.stringify({ fuel: { ok: true }, tires: { ok: true }, bodywork: { ok: true }, lights: { ok: true }, docs: { ok: true } }),
      observation: 'Saída para rota Zona Sul - veículo abastecido e revisado.',
      hasProblem: false,
      createdAt: v1Start,
    },
  });
  const chk1Out = await prisma.vehicleChecklist.create({
    data: {
      tenantId: tenant.id,
      vehicleId: veh1.id,
      driverId: driver1.id,
      type: 'EXIT',
      mileage: 18450,
      itemsResult: JSON.stringify({ fuel: { ok: true }, tires: { ok: true }, bodywork: { ok: true }, lights: { ok: true }, docs: { ok: true } }),
      observation: 'Retorno sem alterações, entregue lavado no pátio.',
      hasProblem: false,
      createdAt: v1End,
    },
  });
  await prisma.vehicleUsage.create({
    data: {
      tenantId: tenant.id,
      vehicleId: veh1.id,
      driverId: driver1.id,
      entryChecklistId: chk1In.id,
      exitChecklistId: chk1Out.id,
      startTime: v1Start,
      endTime: v1End,
      lunchStartTime: v1LunchStart,
      lunchEndTime: v1LunchEnd,
      totalLunchMinutes: 60,
      totalDurationMinutes: 515,
      totalDistanceKm: 140,
      status: 'COMPLETED',
      createdAt: v1Start,
    },
  });

  // Viagem 2: Marcos Vinícius Oliveira (veh2 - 2 dias atrás)
  const v2Start = makeDate(2, 7, 30);
  const v2LunchStart = makeDate(2, 12, 15);
  const v2LunchEnd = makeDate(2, 13, 15);
  const v2End = makeDate(2, 18, 10);

  const chk2In = await prisma.vehicleChecklist.create({
    data: {
      tenantId: tenant.id,
      vehicleId: veh2.id,
      driverId: driver2.id,
      type: 'ENTRY',
      mileage: 53980,
      itemsResult: JSON.stringify({ fuel: { ok: true }, tires: { ok: true }, bodywork: { ok: true }, lights: { ok: true }, docs: { ok: true } }),
      observation: 'Viagem logística Guarulhos e região metropolitana.',
      hasProblem: false,
      createdAt: v2Start,
    },
  });
  const chk2Out = await prisma.vehicleChecklist.create({
    data: {
      tenantId: tenant.id,
      vehicleId: veh2.id,
      driverId: driver2.id,
      type: 'EXIT',
      mileage: 54200,
      itemsResult: JSON.stringify({ fuel: { ok: true }, tires: { ok: true }, bodywork: { ok: true }, lights: { ok: true }, docs: { ok: true } }),
      observation: 'Entregas 100% concluídas, nenhum defeito reportado.',
      hasProblem: false,
      createdAt: v2End,
    },
  });
  await prisma.vehicleUsage.create({
    data: {
      tenantId: tenant.id,
      vehicleId: veh2.id,
      driverId: driver2.id,
      entryChecklistId: chk2In.id,
      exitChecklistId: chk2Out.id,
      startTime: v2Start,
      endTime: v2End,
      lunchStartTime: v2LunchStart,
      lunchEndTime: v2LunchEnd,
      totalLunchMinutes: 60,
      totalDurationMinutes: 580,
      totalDistanceKm: 220,
      status: 'COMPLETED',
      createdAt: v2Start,
    },
  });

  // Viagem 3: André Luiz Souza (veh5 Montana - 1 dia atrás -> voltou com avaria e foi para MAINTENANCE)
  const v3Start = makeDate(1, 8, 15);
  const v3LunchStart = makeDate(1, 12, 0);
  const v3LunchEnd = makeDate(1, 12, 45);
  const v3End = makeDate(1, 16, 20);

  const chk3In = await prisma.vehicleChecklist.create({
    data: {
      tenantId: tenant.id,
      vehicleId: veh5.id,
      driverId: driver4.id,
      type: 'ENTRY',
      mileage: 29640,
      itemsResult: JSON.stringify({ fuel: { ok: true }, tires: { ok: true }, bodywork: { ok: true }, lights: { ok: true }, docs: { ok: true } }),
      observation: 'Viatura em condições normais na saída.',
      hasProblem: false,
      createdAt: v3Start,
    },
  });
  const chk3Out = await prisma.vehicleChecklist.create({
    data: {
      tenantId: tenant.id,
      vehicleId: veh5.id,
      driverId: driver4.id,
      type: 'EXIT',
      mileage: 29750,
      itemsResult: JSON.stringify({
        fuel: { ok: true },
        tires: { ok: false, observation: 'Pneu traseiro direito perdendo pressão' },
        bodywork: { ok: true },
        lights: { ok: false, observation: 'Lanterna traseira esquerda queimada' },
        docs: { ok: true },
      }),
      observation: 'Pneu traseiro murcho e lâmpada da lanterna esquerda queimada. Encaminhado à oficina.',
      hasProblem: true,
      createdAt: v3End,
    },
  });
  await prisma.vehicleUsage.create({
    data: {
      tenantId: tenant.id,
      vehicleId: veh5.id,
      driverId: driver4.id,
      entryChecklistId: chk3In.id,
      exitChecklistId: chk3Out.id,
      startTime: v3Start,
      endTime: v3End,
      lunchStartTime: v3LunchStart,
      lunchEndTime: v3LunchEnd,
      totalLunchMinutes: 45,
      totalDurationMinutes: 440,
      totalDistanceKm: 110,
      status: 'COMPLETED',
      createdAt: v3Start,
    },
  });

  // Viagem 4: Carlos Eduardo Silva (veh6 Fiorino - 1 dia atrás)
  const v4Start = makeDate(1, 9, 0);
  const v4End = makeDate(1, 15, 0);
  const chk4In = await prisma.vehicleChecklist.create({
    data: {
      tenantId: tenant.id,
      vehicleId: veh6.id,
      driverId: driver1.id,
      type: 'ENTRY',
      mileage: 67315,
      itemsResult: JSON.stringify({ fuel: { ok: true }, tires: { ok: true }, bodywork: { ok: true }, lights: { ok: true }, docs: { ok: true } }),
      observation: 'Coleta rápida no centro.',
      hasProblem: false,
      createdAt: v4Start,
    },
  });
  const chk4Out = await prisma.vehicleChecklist.create({
    data: {
      tenantId: tenant.id,
      vehicleId: veh6.id,
      driverId: driver1.id,
      type: 'EXIT',
      mileage: 67400,
      itemsResult: JSON.stringify({ fuel: { ok: true }, tires: { ok: true }, bodywork: { ok: true }, lights: { ok: true }, docs: { ok: true } }),
      observation: 'Operação concluída sem intercorrências.',
      hasProblem: false,
      createdAt: v4End,
    },
  });
  await prisma.vehicleUsage.create({
    data: {
      tenantId: tenant.id,
      vehicleId: veh6.id,
      driverId: driver1.id,
      entryChecklistId: chk4In.id,
      exitChecklistId: chk4Out.id,
      startTime: v4Start,
      endTime: v4End,
      totalLunchMinutes: 0,
      totalDurationMinutes: 360,
      totalDistanceKm: 85,
      status: 'COMPLETED',
      createdAt: v4Start,
    },
  });

  // Viagem 5 (EM ANDAMENTO hoje): Lucas Gabriel Pereira com Renault Duster TAP4D04
  const v5Start = makeDate(0, 8, 20);
  const chk5In = await prisma.vehicleChecklist.create({
    data: {
      tenantId: tenant.id,
      vehicleId: veh4.id,
      driverId: driver3.id,
      type: 'ENTRY',
      mileage: 41890,
      itemsResult: JSON.stringify({ fuel: { ok: true }, tires: { ok: true }, bodywork: { ok: true }, lights: { ok: true }, docs: { ok: true } }),
      observation: 'Saída para rota Zona Oeste e Osasco.',
      hasProblem: false,
      createdAt: v5Start,
    },
  });
  await prisma.vehicleUsage.create({
    data: {
      tenantId: tenant.id,
      vehicleId: veh4.id,
      driverId: driver3.id,
      entryChecklistId: chk5In.id,
      startTime: v5Start,
      totalLunchMinutes: 0,
      totalDurationMinutes: 0,
      totalDistanceKm: 0,
      status: 'IN_PROGRESS',
      createdAt: v5Start,
    },
  });

  // 6. Batidas de Ponto CLT Fictícias
  const punchesData = [
    { userId: driver1.id, type: 'ENTRADA', timestamp: makeDate(1, 8, 0), isOffline: false },
    { userId: driver1.id, type: 'ALMOCO_SAIDA', timestamp: makeDate(1, 12, 0), isOffline: false },
    { userId: driver1.id, type: 'ALMOCO_RETORNO', timestamp: makeDate(1, 13, 0), isOffline: false },
    { userId: driver1.id, type: 'SAIDA', timestamp: makeDate(1, 17, 15), isOffline: false },
    { userId: driver2.id, type: 'ENTRADA', timestamp: makeDate(0, 7, 45), isOffline: false },
    { userId: driver2.id, type: 'ALMOCO_SAIDA', timestamp: makeDate(0, 12, 5), isOffline: true },
    { userId: driver3.id, type: 'ENTRADA', timestamp: makeDate(0, 8, 10), isOffline: false },
    { userId: driver4.id, type: 'ENTRADA', timestamp: makeDate(0, 8, 30), isOffline: false },
  ];

  for (const p of punchesData) {
    await prisma.timeClocking.create({
      data: {
        tenantId: tenant.id,
        userId: p.userId,
        type: p.type,
        timestamp: p.timestamp,
        isOffline: p.isOffline,
        createdAt: p.timestamp,
      },
    });
  }

  // 7. Logs e Notificacoes para o Gestor / Admin
  await prisma.auditLog.createMany({
    data: [
      {
        tenantId: tenant.id,
        userId: userAdmin.id,
        action: 'INICIO_ROTA',
        entityType: 'SYSTEM',
        entityId: tenant.id,
        details: JSON.stringify({
          message: 'Base Teste Apresentação inicializada com 7 colaboradores e 6 viaturas.',
        }),
        timestamp: makeDate(0, 7, 0),
      },
      {
        tenantId: tenant.id,
        userId: driver4.id,
        action: 'ALERTA_AVARIA',
        entityType: 'VEHICLE_CHECKLIST',
        entityId: chk3Out.id,
        details: JSON.stringify({
          message: 'Avaria reportada no veículo TAP5E05 (Chevrolet Montana): Pneu traseiro murcho e lanterna queimada. Enviado para Oficina.',
        }),
        timestamp: v3End,
      },
      {
        tenantId: tenant.id,
        userId: driver3.id,
        action: 'INICIO_ROTA',
        entityType: 'VEHICLE_USAGE',
        entityId: veh4.id,
        details: JSON.stringify({
          message: 'Lucas Gabriel Pereira iniciou rota com Renault Duster Iconic 1.6 (TAP4D04). Km inicial: 41890 km.',
        }),
        timestamp: v5Start,
      },
      {
        tenantId: tenant.id,
        userId: userManager1.id,
        action: 'BATIDA_PONTO',
        entityType: 'TIME_CLOCKING',
        entityId: driver2.id,
        details: JSON.stringify({
          message: 'Marcos Vinícius Oliveira sincronizou batida de ponto CLT offline (Saída Almoço).',
        }),
        timestamp: makeDate(0, 12, 10),
      },
    ],
  });

  console.log('Seed da empresa "Teste Apresentação" concluido com sucesso!');
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
