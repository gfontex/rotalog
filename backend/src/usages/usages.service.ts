// Controle de rotas (inicio de viagem, pausa de almoco, retomada e devolucao de veiculo)

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChecklistsService } from '../checklists/checklists.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { StartUsageDto, FinishUsageDto } from './dto/usage.dto';
import { ChecklistTypeEnum } from '../checklists/dto/create-checklist.dto';

@Injectable()
export class UsagesService {
  constructor(
    private prisma: PrismaService,
    private checklistsService: ChecklistsService,
    private vehiclesService: VehiclesService,
  ) {}

  // Busca todas as viagens (para GESTOR e ADMIN)
  async findAll(tenantId?: string) {
    const list = await this.prisma.vehicleUsage.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true, cpf: true, role: true } },
        entryChecklist: true,
        exitChecklist: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((u) => ({
      ...u,
      vehiclePlate: u.vehicle?.plate || '',
      vehicleModel: `${u.vehicle?.brand || ''} ${u.vehicle?.model || ''}`.trim(),
      entryChecklist: u.entryChecklist
        ? {
            ...u.entryChecklist,
            itemsResult:
              typeof u.entryChecklist.itemsResult === 'string'
                ? JSON.parse(u.entryChecklist.itemsResult)
                : u.entryChecklist.itemsResult,
          }
        : null,
      exitChecklist: u.exitChecklist
        ? {
            ...u.exitChecklist,
            itemsResult:
              typeof u.exitChecklist.itemsResult === 'string'
                ? JSON.parse(u.exitChecklist.itemsResult)
                : u.exitChecklist.itemsResult,
          }
        : null,
    }));
  }

  // REGRA DO MOTORISTA: Busca estritamente as viagens do motorista autenticado!
  async findByDriver(driverId: string) {
    const list = await this.prisma.vehicleUsage.findMany({
      where: { driverId },
      include: {
        vehicle: true,
        driver: { select: { id: true, name: true, cpf: true, role: true } },
        entryChecklist: true,
        exitChecklist: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return list.map((u) => ({
      ...u,
      vehiclePlate: u.vehicle?.plate || '',
      vehicleModel: `${u.vehicle?.brand || ''} ${u.vehicle?.model || ''}`.trim(),
      entryChecklist: u.entryChecklist
        ? {
            ...u.entryChecklist,
            itemsResult:
              typeof u.entryChecklist.itemsResult === 'string'
                ? JSON.parse(u.entryChecklist.itemsResult)
                : u.entryChecklist.itemsResult,
          }
        : null,
      exitChecklist: u.exitChecklist
        ? {
            ...u.exitChecklist,
            itemsResult:
              typeof u.exitChecklist.itemsResult === 'string'
                ? JSON.parse(u.exitChecklist.itemsResult)
                : u.exitChecklist.itemsResult,
          }
        : null,
    }));
  }

  // Busca a rota ativa no momento para o motorista
  async findActiveByDriver(driverId: string) {
    const active = await this.prisma.vehicleUsage.findFirst({
      where: {
        driverId,
        status: { in: ['IN_PROGRESS', 'PAUSED_LUNCH'] },
      },
      include: {
        vehicle: true,
        entryChecklist: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!active) return null;

    return {
      ...active,
      entryChecklist: active.entryChecklist
        ? {
            ...active.entryChecklist,
            itemsResult:
              typeof active.entryChecklist.itemsResult === 'string'
                ? JSON.parse(active.entryChecklist.itemsResult)
                : active.entryChecklist.itemsResult,
          }
        : null,
    };
  }

  // FLUXO B: INICIAR ROTA COM CHECKLIST DE ENTRADA
  async startUsage(dto: StartUsageDto) {
    // 1. Validar motorista e rota ativa anterior
    const driver = await this.prisma.user.findUnique({ where: { id: dto.driverId } });
    if (!driver) {
      throw new NotFoundException('Motorista/Colaborador não encontrado.');
    }

    const activeUsage = await this.prisma.vehicleUsage.findFirst({
      where: {
        driverId: dto.driverId,
        status: { in: ['IN_PROGRESS', 'PAUSED_LUNCH'] },
      },
      include: { vehicle: true },
    });
    if (activeUsage) {
      throw new BadRequestException(
        `O condutor ${driver.name} já possui uma rota em andamento com o veículo ${activeUsage.vehicle?.plate || 'em trânsito'}. Finalize-a antes de iniciar uma nova rota.`
      );
    }

    // 2. Validar que o veiculo esta realmente AVAILABLE
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id: dto.vehicleId } });
    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado.');
    }
    if (vehicle.status !== 'AVAILABLE') {
      throw new BadRequestException(
        `O veículo ${vehicle.plate} não está disponível (Status atual: ${vehicle.status}).`
      );
    }

    const tenantId = dto.tenantId || vehicle.tenantId;

    // 3. Criar Checklist de Saida
    const entryChecklist = await this.checklistsService.create({
      tenantId,
      vehicleId: dto.vehicleId,
      driverId: dto.driverId,
      type: ChecklistTypeEnum.ENTRY,
      mileage: dto.mileage,
      itemsResult: dto.itemsResult,
      observation: dto.observation,
    });

    // 3. Atualizar Veiculo para IN_USE
    await this.vehiclesService.updateStatus(dto.vehicleId, {
      status: 'IN_USE' as any,
      currentMileage: dto.mileage,
    });

    // 4. Criar Registro de Uso / Viagem no Banco
    const usage = await this.prisma.vehicleUsage.create({
      data: {
        tenantId,
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        entryChecklistId: entryChecklist.id,
        startTime: new Date(),
        status: 'IN_PROGRESS',
        totalLunchMinutes: 0,
        totalDurationMinutes: 0,
        totalDistanceKm: 0,
      },
      include: {
        vehicle: true,
        entryChecklist: true,
      },
    });

    // 5. Notificacao Instantanea para o Gestor de Frota e Admin
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: dto.driverId,
        action: 'INICIO_ROTA',
        entityType: 'VEHICLE_USAGE',
        entityId: usage.id,
        details: JSON.stringify({
          message: `${driver?.name || 'Motorista'} iniciou rota com o veículo ${vehicle.brand} ${vehicle.model}, placa ${vehicle.plate}. Km inicial: ${dto.mileage} km.`,
          driverName: driver?.name,
          vehiclePlate: vehicle.plate,
          mileage: dto.mileage,
          startTime: new Date(),
        }),
      },
    });

    return {
      ...usage,
      entryChecklist: {
        ...entryChecklist,
        itemsResult: dto.itemsResult,
      },
    };
  }

  // FLUXO C: PAUSAR PARA ALMOCO
  async pauseLunch(usageId: string) {
    const usage = await this.prisma.vehicleUsage.findUnique({
      where: { id: usageId },
      include: { driver: true, vehicle: true },
    });
    if (!usage) {
      throw new NotFoundException('Sessão de rota não encontrada.');
    }

    const now = new Date();
    const updated = await this.prisma.vehicleUsage.update({
      where: { id: usageId },
      data: {
        lunchStartTime: now,
        status: 'PAUSED_LUNCH',
      },
      include: { vehicle: true, entryChecklist: true },
    });

    // Notificacao para o gestor
    await this.prisma.auditLog.create({
      data: {
        tenantId: usage.tenantId,
        userId: usage.driverId,
        action: 'PAUSA_ALMOCO',
        entityType: 'VEHICLE_USAGE',
        entityId: usageId,
        details: JSON.stringify({
          message: `${usage.driver?.name || 'Motorista'} pausou para almoço às ${now.toLocaleTimeString('pt-BR')}. Viatura: ${usage.vehicle?.plate}`,
          driverName: usage.driver?.name,
          plate: usage.vehicle?.plate,
          time: now,
        }),
      },
    });

    return updated;
  }

  // FLUXO C: RETOMAR ROTA APOS ALMOCO
  async resumeLunch(usageId: string) {
    const usage = await this.prisma.vehicleUsage.findUnique({
      where: { id: usageId },
      include: { driver: true, vehicle: true },
    });
    if (!usage) {
      throw new NotFoundException('Sessão de rota não encontrada.');
    }

    const now = new Date();
    let lunchMins = 0;
    if (usage.lunchStartTime) {
      const diffMs = now.getTime() - new Date(usage.lunchStartTime).getTime();
      lunchMins = Math.round(diffMs / 60000);
    }
    const newTotalLunch = (usage.totalLunchMinutes || 0) + lunchMins;

    const updated = await this.prisma.vehicleUsage.update({
      where: { id: usageId },
      data: {
        lunchEndTime: now,
        totalLunchMinutes: newTotalLunch,
        status: 'IN_PROGRESS',
      },
      include: { vehicle: true, entryChecklist: true },
    });

    // Notificacao para o gestor
    await this.prisma.auditLog.create({
      data: {
        tenantId: usage.tenantId,
        userId: usage.driverId,
        action: 'RETOMADA_ALMOCO',
        entityType: 'VEHICLE_USAGE',
        entityId: usageId,
        details: JSON.stringify({
          message: `${usage.driver?.name || 'Motorista'} retornou do almoço (${newTotalLunch} min gastos) e retomou a rota com o veículo ${usage.vehicle?.plate}.`,
          driverName: usage.driver?.name,
          plate: usage.vehicle?.plate,
          lunchMinutes: newTotalLunch,
        }),
      },
    });

    return updated;
  }

  // FLUXO D: DEVOLUCAO & FINALIZACAO DA ROTA
  async finishUsage(usageId: string, dto: FinishUsageDto) {
    const usage = await this.prisma.vehicleUsage.findUnique({
      where: { id: usageId },
      include: { driver: true, vehicle: true, entryChecklist: true },
    });
    if (!usage) {
      throw new NotFoundException('Sessão de rota não encontrada.');
    }

    if (usage.status === 'COMPLETED') {
      throw new BadRequestException('Esta rota já foi finalizada anteriormente.');
    }

    const entryMileage = usage.entryChecklist?.mileage || 0;
    if (dto.exitMileage < entryMileage) {
      throw new BadRequestException(
        `O odômetro final (${dto.exitMileage} km) não pode ser menor que o inicial (${entryMileage} km).`
      );
    }

    // 1. Criar Checklist de Devolucao
    const exitChecklist = await this.checklistsService.create({
      tenantId: usage.tenantId,
      vehicleId: usage.vehicleId,
      driverId: usage.driverId,
      type: ChecklistTypeEnum.EXIT,
      mileage: dto.exitMileage,
      itemsResult: dto.itemsResult,
      observation: dto.observation,
    });

    // 2. Calculos Liquidos de Viagem e Distancia (ajusta almoco caso finalizado direto da pausa)
    const endTime = new Date();
    const startTime = new Date(usage.startTime);
    let totalLunch = usage.totalLunchMinutes || 0;
    let lunchEndTime = usage.lunchEndTime;

    if (usage.status === 'PAUSED_LUNCH' && usage.lunchStartTime) {
      const extraLunchMs = endTime.getTime() - new Date(usage.lunchStartTime).getTime();
      totalLunch += Math.max(0, Math.round(extraLunchMs / 60000));
      lunchEndTime = endTime;
    }

    const grossMinutes = Math.max(1, Math.round((endTime.getTime() - startTime.getTime()) / 60000));
    const netMinutes = Math.max(0, grossMinutes - totalLunch);
    const distanceKm = dto.exitMileage - entryMileage;

    // 3. Atualizar Status do Veiculo
    // Se houve avaria -> MAINTENANCE (Oficina); senao -> AVAILABLE (Disponivel no patio)
    const finalVehicleStatus = exitChecklist.hasProblem ? 'MAINTENANCE' : 'AVAILABLE';

    await this.vehiclesService.updateStatus(usage.vehicleId, {
      status: finalVehicleStatus as any,
      currentMileage: dto.exitMileage,
    });

    // 4. Concluir Rota no Banco
    const completedUsage = await this.prisma.vehicleUsage.update({
      where: { id: usageId },
      data: {
        exitChecklistId: exitChecklist.id,
        endTime,
        lunchEndTime,
        totalLunchMinutes: totalLunch,
        totalDistanceKm: distanceKm,
        totalDurationMinutes: netMinutes,
        status: 'COMPLETED',
      },
      include: {
        vehicle: true,
        entryChecklist: true,
        exitChecklist: true,
      },
    });

    // 5. Notificacao de Finalizacao
    await this.prisma.auditLog.create({
      data: {
        tenantId: usage.tenantId,
        userId: usage.driverId,
        action: 'FIM_ROTA',
        entityType: 'VEHICLE_USAGE',
        entityId: usageId,
        details: JSON.stringify({
          message: `${usage.driver?.name || 'Motorista'} finalizou rota com o veículo ${usage.vehicle?.brand} ${usage.vehicle?.model} (${usage.vehicle?.plate}). Percorreu ${distanceKm} km em ${netMinutes} min de viagem líquida. Status do veículo: ${finalVehicleStatus === 'MAINTENANCE' ? 'OFICINA (Avaria Relatada)' : 'DISPONÍVEL'}.`,
          driverName: usage.driver?.name,
          plate: usage.vehicle?.plate,
          distanceKm,
          netMinutes,
          lunchMinutes: usage.totalLunchMinutes,
          hasProblem: exitChecklist.hasProblem,
        }),
      },
    });

    return {
      ...completedUsage,
      exitChecklist: {
        ...exitChecklist,
        itemsResult: dto.itemsResult,
      },
      finalVehicleStatus,
    };
  }
}
