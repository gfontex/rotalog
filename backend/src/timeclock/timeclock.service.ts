import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateClockingDto } from './dto/create-clocking.dto.js';
import { ClockingType } from '@prisma/client';

export interface WorkShiftAnalysis {
  shiftDate: string;
  totalWorkMinutes: number;
  totalWorkHours: number;
  totalLunchMinutes: number;
  isComplete: boolean;
  hasAlerts: boolean;
  alerts: string[];
}

@Injectable()
export class TimeclockService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registro de Batida de Ponto Manual e Direto (Entrada, Saída ou Intervalo de Almoço)
   */
  async punch(tenantId: string, userId: string, dto: CreateClockingDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException('Colaborador não encontrado ou inativo.');
    }

    const punchTimestamp = dto.timestamp ? new Date(dto.timestamp) : new Date();

    // Salvar registro do Ponto Direto
    const clocking = await this.prisma.timeClocking.create({
      data: {
        tenantId,
        userId,
        type: dto.type,
        timestamp: punchTimestamp,
        facialVerified: false,
        matchConfidence: null,
        manualFallbackReason: dto.fallbackReason || 'Registro Manual Operacional',
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
      },
    });

    // 4. Recalcular e consolidar a Jornada do Dia (CLT)
    const shiftAnalysis = await this.recalculateWorkShift(tenantId, userId, punchTimestamp);

    return {
      clocking,
      shiftAnalysis,
      message: 'Ponto registrado com sucesso.',
    };
  }

  /**
   * Recalcula a jornada diária com base na CLT:
   * - Jornada padrão: 8 horas (480 minutos)
   * - Intervalo intrajornada (almoço): Mínimo obrigatório de 60 minutos (Art. 71 CLT)
   * - Janela de tolerância: 10 minutos diários (Art. 58, § 1º CLT)
   * - Limite máximo de horas extras: 2 horas diárias (total 10h)
   */
  async recalculateWorkShift(tenantId: string, userId: string, referenceDate: Date): Promise<WorkShiftAnalysis> {
    const startOfDay = new Date(referenceDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(referenceDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Buscar todas as batidas do colaborador no dia
    const clockings = await this.prisma.timeClocking.findMany({
      where: {
        tenantId,
        userId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    const alerts: string[] = [];
    let totalWorkMinutes = 0;
    let totalLunchMinutes = 0;

    const entryClock = clockings.find((c) => c.type === ClockingType.IN);
    const lunchOut = clockings.find((c) => c.type === ClockingType.LUNCH_OUT);
    const lunchIn = clockings.find((c) => c.type === ClockingType.LUNCH_IN);
    const exitClock = clockings.slice().reverse().find((c) => c.type === ClockingType.OUT);

    // Cálculo do Intervalo de Almoço
    if (lunchOut && lunchIn) {
      const lunchMillis = new Date(lunchIn.timestamp).getTime() - new Date(lunchOut.timestamp).getTime();
      totalLunchMinutes = Math.max(0, Math.round(lunchMillis / 60000));

      // Regra CLT: Intervalo intrajornada mínimo de 1 hora (60 minutos)
      if (totalLunchMinutes < 60) {
        alerts.push(
          `Alerta CLT: Intervalo de almoço inferior a 1 hora (${totalLunchMinutes} min registrados). Exige atenção para evitar passivo trabalhista (Art. 71).`,
        );
      } else if (totalLunchMinutes > 120) {
        alerts.push(`Alerta: Intervalo de almoço superior a 2 horas (${totalLunchMinutes} min).`);
      }
    }

    // Cálculo das Horas Trabalhadas
    if (entryClock && exitClock) {
      const totalElapsedMillis = new Date(exitClock.timestamp).getTime() - new Date(entryClock.timestamp).getTime();
      const totalElapsedMinutes = Math.max(0, Math.round(totalElapsedMillis / 60000));
      totalWorkMinutes = Math.max(0, totalElapsedMinutes - totalLunchMinutes);
    } else if (entryClock && lunchOut && !lunchIn && !exitClock) {
      // Período da manhã apenas
      const morningMillis = new Date(lunchOut.timestamp).getTime() - new Date(entryClock.timestamp).getTime();
      totalWorkMinutes = Math.max(0, Math.round(morningMillis / 60000));
    }

    const isComplete = !!(entryClock && exitClock && (!lunchOut || lunchIn));

    if (!isComplete && clockings.length > 0) {
      alerts.push('Jornada incompleta: aguardando batida de saída ou retorno do almoço.');
    }

    // Regra CLT: Limites de jornada
    if (totalWorkMinutes > 480 + 10) {
      const extraMinutes = totalWorkMinutes - 480;
      alerts.push(`Horas extras identificadas: ${Math.floor(extraMinutes / 60)}h ${extraMinutes % 60}m além da jornada padrão de 8h.`);
    }

    if (totalWorkMinutes > 600) {
      alerts.push('ALERTA CRÍTICO: Limite legal diário de 10 horas de trabalho ultrapassado (Art. 59 CLT).');
    }

    const hasAlerts = alerts.length > 0;
    const alertDetails = alerts.join(' | ');

    // Salvar ou atualizar consolidação no banco (WorkShift)
    await this.prisma.workShift.upsert({
      where: {
        tenantId_userId_shiftDate: {
          tenantId,
          userId,
          shiftDate: startOfDay,
        },
      },
      create: {
        tenantId,
        userId,
        shiftDate: startOfDay,
        totalWorkMinutes,
        totalLunchMinutes,
        isComplete,
        hasAlerts,
        alertDetails: hasAlerts ? alertDetails : null,
      },
      update: {
        totalWorkMinutes,
        totalLunchMinutes,
        isComplete,
        hasAlerts,
        alertDetails: hasAlerts ? alertDetails : null,
      },
    });

    return {
      shiftDate: startOfDay.toISOString().split('T')[0],
      totalWorkMinutes,
      totalWorkHours: Number((totalWorkMinutes / 60).toFixed(2)),
      totalLunchMinutes,
      isComplete,
      hasAlerts,
      alerts,
    };
  }

  /**
   * Espelho de Ponto Mensal do Colaborador (Para RH e Fiscalização Trabalhista)
   */
  async getTimesheet(tenantId: string, userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { branch: true },
    });

    if (!user) {
      throw new NotFoundException('Colaborador não encontrado.');
    }

    const shifts = await this.prisma.workShift.findMany({
      where: {
        tenantId,
        userId,
        shiftDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { shiftDate: 'asc' },
    });

    const clockings = await this.prisma.timeClocking.findMany({
      where: {
        tenantId,
        userId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    let totalAccumulatedMinutes = 0;
    let totalOvertimeMinutes = 0;
    let totalAlertCount = 0;

    for (const shift of shifts) {
      totalAccumulatedMinutes += shift.totalWorkMinutes;
      if (shift.totalWorkMinutes > 480) {
        totalOvertimeMinutes += shift.totalWorkMinutes - 480;
      }
      if (shift.hasAlerts) {
        totalAlertCount++;
      }
    }

    return {
      colaborador: {
        id: user.id,
        nome: user.name,
        cpf: user.cpf,
        email: user.email,
        filial: user.branch?.name || 'Matriz',
      },
      periodo: {
        mes: month,
        ano: year,
      },
      resumoMensal: {
        totalHorasTrabalhadas: Number((totalAccumulatedMinutes / 60).toFixed(1)),
        totalHorasExtras: Number((totalOvertimeMinutes / 60).toFixed(1)),
        totalDiasRegistrados: shifts.length,
        diasComAlertas: totalAlertCount,
      },
      dias: shifts,
      batidas: clockings,
    };
  }

  /**
   * Visão Consolidada de RH de todos os colaboradores no mês
   */
  async getConsolidatedReport(tenantId: string, month: number, year: number) {
    const users = await this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      include: { branch: true },
    });

    const report = [];
    for (const user of users) {
      const timesheet = await this.getTimesheet(tenantId, user.id, month, year);
      report.push({
        id: user.id,
        nome: user.name,
        cpf: user.cpf,
        cargo: user.role,
        filial: user.branch?.name || 'Matriz',
        ...timesheet.resumoMensal,
      });
    }

    return report;
  }
}
