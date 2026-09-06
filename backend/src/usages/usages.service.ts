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
