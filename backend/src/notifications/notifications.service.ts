import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId?: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        user: { select: { id: true, name: true, cpf: true, role: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 60,
    });

    return logs.map((l) => ({
      id: l.id,
      tenantId: l.tenantId,
      userId: l.userId,
      userName: l.user?.name || null,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      details: typeof l.details === 'string' ? JSON.parse(l.details) : l.details,
      timestamp: l.timestamp,
    }));
  }

  async getDashboardStats(tenantId?: string) {
    const whereTenant = tenantId ? { tenantId } : {};

    const [
      totalVehicles,
      availableVehicles,
      inUseVehicles,
      maintenanceVehicles,
      totalDrivers,
      activeRoutes,
      usages,
      notificationsCount,
    ] = await Promise.all([
      this.prisma.vehicle.count({ where: whereTenant }),
      this.prisma.vehicle.count({ where: { ...whereTenant, status: 'AVAILABLE' } }),
      this.prisma.vehicle.count({ where: { ...whereTenant, status: 'IN_USE' } }),
      this.prisma.vehicle.count({ where: { ...whereTenant, status: 'MAINTENANCE' } }),
      this.prisma.user.count({ where: { ...whereTenant, role: 'DRIVER' } }),
      this.prisma.vehicleUsage.count({
        where: { ...whereTenant, status: { in: ['IN_PROGRESS', 'PAUSED_LUNCH'] } },
      }),
      this.prisma.vehicleUsage.findMany({
        where: { ...whereTenant, status: 'COMPLETED' },
        select: { totalDistanceKm: true },
      }),
      this.prisma.auditLog.count({ where: whereTenant }),
    ]);

    const totalKmDriven = usages.reduce((sum, u) => sum + (u.totalDistanceKm || 0), 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalPunchesToday = await this.prisma.timeClocking.count({
      where: {
        ...whereTenant,
        timestamp: { gte: today },
      },
    });

    return {
      totalVehicles,
      availableVehicles,
      inUseVehicles,
      maintenanceVehicles,
      totalDrivers,
      activeRoutesCount: activeRoutes,
      totalKmDriven,
      notificationsCount,
      totalPunchesToday,
    };
  }
}
