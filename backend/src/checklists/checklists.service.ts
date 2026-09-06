import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateChecklistDto } from './dto/create-checklist.dto.js';
import { ChecklistType, VehicleStatus } from '@prisma/client';

@Injectable()
export class ChecklistsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, driverId: string, dto: CreateChecklistDto) {
    // 1. Validar veículo
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, tenantId },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado ou não pertence a esta empresa.');
    }

    // 2. Determinar se há problema reportado
    const hasProblem =
      dto.hasProblem !== undefined
        ? dto.hasProblem
        : Object.values(dto.itemsResult).some((itemOk) => itemOk === false);

    // 3. Salvar o registro do Checklist
    const checklist = await this.prisma.vehicleChecklist.create({
      data: {
        tenantId,
        vehicleId: dto.vehicleId,
        driverId,
        type: dto.type,
        mileage: dto.mileage,
        itemsResult: dto.itemsResult,
        photoUrls: dto.photoUrls || [],
        observation: dto.observation || null,
        hasProblem,
      },
      include: {
        vehicle: true,
        driver: {
          select: {
            id: true,
            name: true,
            cpf: true,
          },
        },
      },
    });

    // 4. Lógica de Entrada (Início de Rota)
    if (dto.type === ChecklistType.ENTRY) {
      // Atualiza o veículo para EM USO e atualiza quilometragem
      await this.prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          status: VehicleStatus.IN_USE,
          currentMileage: Math.max(vehicle.currentMileage, dto.mileage),
        },
      });

      // Abre a sessão de uso veicular (VehicleUsage)
      const usage = await this.prisma.vehicleUsage.create({
        data: {
          tenantId,
          vehicleId: vehicle.id,
          driverId,
          entryChecklistId: checklist.id,
          startTime: new Date(),
        },
      });

      // Registra notificação em tempo real para os gestores / administradores
      const driver = this.prisma.user ? await this.prisma.user.findUnique({ where: { id: driverId }, select: { name: true } }) : null;
      const driverName = driver?.name || 'Motorista';
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId: driverId,
          action: 'INICIO_ROTA',
          entityType: 'VEHICLE',
          entityId: vehicle.id,
          details: {
            message: `${driverName} iniciou rota com o carro ${vehicle.brand} ${vehicle.model}, placa ${vehicle.plate}.`,
            driverName,
            vehiclePlate: vehicle.plate,
            vehicleModel: `${vehicle.brand} ${vehicle.model}`,
            type: 'INICIO_ROTA',
          },
        },
      });

      return {
        checklist,
        usage,
        message: 'Checklist de entrada concluído. Veículo liberado para uso.',
      };
    }

    // 5. Lógica de Saída (Fim de Rota / Devolução)
    if (dto.type === ChecklistType.EXIT) {
      // Localiza a sessão de uso ativa para fechar
      const activeUsage = await this.prisma.vehicleUsage.findFirst({
        where: {
          tenantId,
          vehicleId: vehicle.id,
          driverId,
          endTime: null,
        },
        include: {
          entryChecklist: true,
        },
        orderBy: { startTime: 'desc' },
      });

      let calculatedDuration: number | null = null;
      let calculatedDistance: number | null = null;

      if (activeUsage) {
        const endTime = new Date();
        const startMillis = new Date(activeUsage.startTime).getTime();
        const durationMinutes = Math.max(0, Math.round((endTime.getTime() - startMillis) / 60000));
        calculatedDuration = durationMinutes;

        const entryMileage = activeUsage.entryChecklist?.mileage ?? vehicle.currentMileage;
        calculatedDistance = Math.max(0, dto.mileage - entryMileage);

        // Atualiza a sessão de uso com encerramento e totais
        await this.prisma.vehicleUsage.update({
          where: { id: activeUsage.id },
          data: {
            exitChecklistId: checklist.id,
            endTime,
            totalDurationMinutes: calculatedDuration,
            totalDistanceKm: calculatedDistance,
          },
        });
      }

      // Se houver problema marcado, o veículo vai para MANUTENÇÃO automaticamente
      const newVehicleStatus = hasProblem ? VehicleStatus.MAINTENANCE : VehicleStatus.AVAILABLE;

      await this.prisma.vehicle.update({
        where: { id: vehicle.id },
        data: {
          status: newVehicleStatus,
          currentMileage: Math.max(vehicle.currentMileage, dto.mileage),
        },
      });

      // Registra notificação de encerramento da rota para os gestores
      const exitDriver = this.prisma.user ? await this.prisma.user.findUnique({ where: { id: driverId }, select: { name: true } }) : null;
      const exitDriverName = exitDriver?.name || 'Motorista';
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          userId: driverId,
          action: 'FIM_ROTA',
          entityType: 'VEHICLE',
          entityId: vehicle.id,
          details: {
            message: `${exitDriverName} finalizou o uso do carro ${vehicle.brand} ${vehicle.model}, placa ${vehicle.plate}.`,
            driverName: exitDriverName,
            vehiclePlate: vehicle.plate,
            vehicleModel: `${vehicle.brand} ${vehicle.model}`,
            distanceKm: calculatedDistance,
            durationMinutes: calculatedDuration,
            hasProblem,
            type: 'FIM_ROTA',
          },
        },
      });

      // Se houver problema, registrar log de auditoria / alerta para o gestor
      if (hasProblem) {
        await this.prisma.auditLog.create({
          data: {
            tenantId,
            userId: driverId,
            action: 'ALERTA_AVARIA_VEICULO',
            entityType: 'VEHICLE',
            entityId: vehicle.id,
            details: {
              plate: vehicle.plate,
              checklistId: checklist.id,
              mileage: dto.mileage,
              itemsWithProblem: Object.entries(dto.itemsResult)
                .filter(([_, ok]) => !ok)
                .map(([item]) => item),
              observation: dto.observation,
            },
          },
        });
      }

      return {
        checklist,
        usageCompleted: {
          totalDurationMinutes: calculatedDuration,
          totalDistanceKm: calculatedDistance,
        },
        vehicleStatus: newVehicleStatus,
        message: hasProblem
          ? 'Checklist de saída registrado com avaria. Veículo direcionado para MANUTENÇÃO.'
          : 'Checklist de saída concluído com sucesso. Veículo devolvido e liberado.',
      };
    }

    return { checklist };
  }

  async findAll(
    tenantId: string,
    options?: { vehicleId?: string; driverId?: string; hasProblem?: boolean },
  ) {
    const where: any = { tenantId };
    if (options?.vehicleId) where.vehicleId = options.vehicleId;
    if (options?.driverId) where.driverId = options.driverId;
    if (options?.hasProblem !== undefined) where.hasProblem = options.hasProblem;

    return this.prisma.vehicleChecklist.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            plate: true,
            brand: true,
            model: true,
          },
        },
        driver: {
          select: {
            id: true,
            name: true,
            cpf: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findOne(tenantId: string, id: string) {
    const checklist = await this.prisma.vehicleChecklist.findFirst({
      where: { id, tenantId },
      include: {
        vehicle: true,
        driver: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
          },
        },
      },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist não encontrado.');
    }

    return checklist;
  }
}
