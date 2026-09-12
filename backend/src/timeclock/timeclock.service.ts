import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PunchClockDto, SyncTimeClocksDto } from './dto/timeclock.dto';

@Injectable()
export class TimeclockService {
  constructor(private prisma: PrismaService) {}

  async punch(dto: PunchClockDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    const tenantId = dto.tenantId || user?.tenantId || (await this.prisma.tenant.findFirst())?.id || '';
    const timestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();

    const record = await this.prisma.timeClocking.create({
      data: {
        tenantId,
        userId: dto.userId,
        type: dto.type,
        timestamp,
        isOffline: dto.isOffline || false,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
      },
      include: {
        user: { select: { id: true, name: true, cpf: true, role: true } },
      },
    });

    const typeLabels: any = {
      ENTRADA: 'Entrada no Turno',
      ALMOCO_SAIDA: 'Saída para Intervalo de Almoço',
      ALMOCO_RETORNO: 'Retorno do Almoço',
      SAIDA: 'Saída / Fim de Expediente',
    };

    // Auditoria / Notificação no banco
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: dto.userId,
        action: 'BATIDA_PONTO',
        entityType: 'TIME_CLOCKING',
        entityId: record.id,
        details: JSON.stringify({
          message: `Ponto registrado por ${user?.name || 'Colaborador'}: [${typeLabels[dto.type] || dto.type}] às ${timestamp.toLocaleTimeString('pt-BR')} ${dto.isOffline ? '(Modo Offline Sincronizado)' : ''}`,
          type: dto.type,
          isOffline: dto.isOffline || false,
        }),
      },
    });

    return record;
  }

  async syncOffline(dto: SyncTimeClocksDto) {
    const results = [];
    for (const clock of dto.clocks) {
      const saved = await this.punch({ ...clock, isOffline: true });
      results.push(saved);
    }
    return {
      syncedCount: results.length,
      records: results,
    };
  }

  async getTodayPunches(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.timeClocking.findMany({
      where: {
        userId,
        timestamp: { gte: today },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  async getReport(tenantId?: string) {
    const punches = await this.prisma.timeClocking.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        user: { select: { id: true, name: true, cpf: true, role: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 200,
    });

    return punches.map((p) => ({
      ...p,
      userName: p.user?.name || 'Colaborador',
      userCpf: p.user?.cpf || '',
      userRole: p.user?.role || '',
    }));
  }
}
