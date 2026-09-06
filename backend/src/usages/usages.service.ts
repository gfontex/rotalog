import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class UsagesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, vehicleId?: string, driverId?: string) {
    const where: any = { tenantId };
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;

    return this.prisma.vehicleUsage.findMany({
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
        entryChecklist: {
          select: {
            id: true,
            mileage: true,
            createdAt: true,
          },
        },
        exitChecklist: {
          select: {
            id: true,
            mileage: true,
            createdAt: true,
            hasProblem: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: 100,
    });
  }

  async getActiveUsage(tenantId: string, driverId: string) {
    return this.prisma.vehicleUsage.findFirst({
      where: {
        tenantId,
        driverId,
        endTime: null,
      },
      include: {
        vehicle: true,
        entryChecklist: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }

  /**
   * Inicia a Pausa de Almoço/Intervalo na rota em andamento (Opção A: 1 clique ágil)
   */
  async startPause(tenantId: string, driverId: string) {
    const active = await this.getActiveUsage(tenantId, driverId);
    if (!active) {
      throw new Error('Nenhuma rota ativa encontrada para este motorista.');
    }

    const updated = await this.prisma.vehicleUsage.update({
      where: { id: active.id },
      data: {
        lunchStartTime: new Date(),
      },
      include: {
        driver: { select: { name: true } },
        vehicle: { select: { plate: true, brand: true, model: true } },
      },
    });

    const driverName = updated.driver?.name || 'Motorista';
    const vehName = updated.vehicle ? `${updated.vehicle.brand} ${updated.vehicle.model} (${updated.vehicle.plate})` : 'veículo';
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: driverId,
        action: 'INICIO_PAUSA_ALMOCO',
        entityType: 'VEHICLE_USAGE',
        entityId: active.id,
        details: {
          message: `${driverName} iniciou uma pausa para o almoço com o ${vehName}.`,
          driverName,
          type: 'INICIO_PAUSA_ALMOCO',
        },
      },
    });

    return updated;
  }

  /**
   * Retoma a rota encerrando a Pausa de Almoço e calculando a duração do intervalo
   */
  async endPause(tenantId: string, driverId: string) {
    const active = await this.getActiveUsage(tenantId, driverId);
    if (!active || !active.lunchStartTime) {
      throw new Error('Nenhuma pausa em andamento para este motorista.');
    }

    const now = new Date();
    const durationMillis = now.getTime() - new Date(active.lunchStartTime).getTime();
    const totalLunchMinutes = Math.max(0, Math.round(durationMillis / 60000));

    const updated = await this.prisma.vehicleUsage.update({
      where: { id: active.id },
      data: {
        lunchEndTime: now,
        totalLunchMinutes,
      },
      include: {
        driver: { select: { name: true } },
        vehicle: { select: { plate: true, brand: true, model: true } },
      },
    });

    const driverName = updated.driver?.name || 'Motorista';
    const vehName = updated.vehicle ? `${updated.vehicle.brand} ${updated.vehicle.model} (${updated.vehicle.plate})` : 'veículo';
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: driverId,
        action: 'FIM_PAUSA_ALMOCO',
        entityType: 'VEHICLE_USAGE',
        entityId: active.id,
        details: {
          message: `${driverName} finalizou a pausa para o almoço (${totalLunchMinutes} min) e retomou o ${vehName}.`,
          driverName,
          totalLunchMinutes,
          type: 'FIM_PAUSA_ALMOCO',
        },
      },
    });

    return updated;
  }

  async getNotifications(tenantId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        tenantId,
        action: {
          in: ['INICIO_ROTA', 'FIM_ROTA', 'INICIO_PAUSA_ALMOCO', 'FIM_PAUSA_ALMOCO', 'ALERTA_AVARIA_VEICULO'],
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
  }

  async getFleetStats(tenantId: string) {
    const usages = await this.prisma.vehicleUsage.findMany({
      where: {
        tenantId,
        endTime: { not: null },
      },
      include: {
        vehicle: {
          select: { plate: true, brand: true, model: true },
        },
        driver: {
          select: { name: true },
        },
      },
    });

    let totalDurationMinutes = 0;
    let totalDistanceKm = 0;

    const perVehicle: Record<string, { plate: string; minutes: number; km: number; trips: number }> = {};

    for (const u of usages) {
      const duration = u.totalDurationMinutes || 0;
      const distance = u.totalDistanceKm || 0;

      totalDurationMinutes += duration;
      totalDistanceKm += distance;

      const plate = u.vehicle.plate;
      if (!perVehicle[plate]) {
        perVehicle[plate] = {
          plate,
          minutes: 0,
          km: 0,
          trips: 0,
        };
      }
      perVehicle[plate].minutes += duration;
      perVehicle[plate].km += distance;
      perVehicle[plate].trips += 1;
    }

    const totalHours = Number((totalDurationMinutes / 60).toFixed(1));

    return {
      totalHours,
      totalDurationMinutes,
      totalDistanceKm,
      totalCompletedTrips: usages.length,
      perVehicle: Object.values(perVehicle),
    };
  }
}
