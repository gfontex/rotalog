import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeclockService } from './timeclock.service.js';
import { ClockingType } from '@prisma/client';

describe('TimeclockService - Regras Trabalhistas CLT', () => {
  let service: TimeclockService;
  let mockPrisma: any;
  let mockBiometrics: any;

  beforeEach(() => {
    mockPrisma = {
      user: { findFirst: vi.fn() },
      timeClocking: { findMany: vi.fn(), create: vi.fn() },
      workShift: { upsert: vi.fn(), findMany: vi.fn() },
    };

    mockBiometrics = {
      calculateEuclideanDistance: vi.fn(),
      distanceToConfidencePercentage: vi.fn(),
    };

    service = new TimeclockService(mockPrisma, mockBiometrics);
  });

  it('deve calcular jornada padrão de 8 horas e 1h de almoço sem gerar alertas', async () => {
    const refDate = new Date('2026-09-06T08:00:00Z');

    // 08:00 Entrada, 12:00 Almoço Saída, 13:00 Almoço Retorno, 17:00 Saída
    mockPrisma.timeClocking.findMany.mockResolvedValue([
      { type: ClockingType.IN, timestamp: new Date('2026-09-06T08:00:00Z') },
      { type: ClockingType.LUNCH_OUT, timestamp: new Date('2026-09-06T12:00:00Z') },
      { type: ClockingType.LUNCH_IN, timestamp: new Date('2026-09-06T13:00:00Z') },
      { type: ClockingType.OUT, timestamp: new Date('2026-09-06T17:00:00Z') },
    ]);
    mockPrisma.workShift.upsert.mockResolvedValue({});

    const result = await service.recalculateWorkShift('tenant-1', 'user-1', refDate);

    expect(result.totalLunchMinutes).toBe(60); // 1h exata
    expect(result.totalWorkMinutes).toBe(480); // 8h exatas (540 - 60)
    expect(result.isComplete).toBe(true);
    expect(result.hasAlerts).toBe(false);
    expect(result.alerts.length).toBe(0);
  });

  it('deve gerar alerta trabalhista quando o intervalo intrajornada for inferior a 1 hora (Art. 71 CLT)', async () => {
    const refDate = new Date('2026-09-06T08:00:00Z');

    // Almoço de apenas 35 minutos (12:00 às 12:35)
    mockPrisma.timeClocking.findMany.mockResolvedValue([
      { type: ClockingType.IN, timestamp: new Date('2026-09-06T08:00:00Z') },
      { type: ClockingType.LUNCH_OUT, timestamp: new Date('2026-09-06T12:00:00Z') },
      { type: ClockingType.LUNCH_IN, timestamp: new Date('2026-09-06T12:35:00Z') },
      { type: ClockingType.OUT, timestamp: new Date('2026-09-06T17:00:00Z') },
    ]);
    mockPrisma.workShift.upsert.mockResolvedValue({});

    const result = await service.recalculateWorkShift('tenant-1', 'user-1', refDate);

    expect(result.totalLunchMinutes).toBe(35);
    expect(result.hasAlerts).toBe(true);
    expect(result.alerts.some((a) => a.includes('Intervalo de almoço inferior a 1 hora'))).toBe(true);
  });

  it('deve identificar e computar horas extras além da tolerância de 10 minutos (Art. 58 CLT)', async () => {
    const refDate = new Date('2026-09-06T08:00:00Z');

    // 08:00 às 18:30 com 1h de almoço = 9h30min de trabalho (570 min)
    mockPrisma.timeClocking.findMany.mockResolvedValue([
      { type: ClockingType.IN, timestamp: new Date('2026-09-06T08:00:00Z') },
      { type: ClockingType.LUNCH_OUT, timestamp: new Date('2026-09-06T12:00:00Z') },
      { type: ClockingType.LUNCH_IN, timestamp: new Date('2026-09-06T13:00:00Z') },
      { type: ClockingType.OUT, timestamp: new Date('2026-09-06T18:30:00Z') },
    ]);
    mockPrisma.workShift.upsert.mockResolvedValue({});

    const result = await service.recalculateWorkShift('tenant-1', 'user-1', refDate);

    expect(result.totalWorkMinutes).toBe(570); // 9.5 horas
    expect(result.hasAlerts).toBe(true);
    expect(result.alerts.some((a) => a.includes('Horas extras identificadas'))).toBe(true);
  });

  it('deve disparar alerta crítico quando a jornada diária ultrapassar o teto legal de 10 horas (Art. 59 CLT)', async () => {
    const refDate = new Date('2026-09-06T08:00:00Z');

    // 08:00 às 20:00 com 1h de almoço = 11h de trabalho (660 min)
    mockPrisma.timeClocking.findMany.mockResolvedValue([
      { type: ClockingType.IN, timestamp: new Date('2026-09-06T08:00:00Z') },
      { type: ClockingType.LUNCH_OUT, timestamp: new Date('2026-09-06T12:00:00Z') },
      { type: ClockingType.LUNCH_IN, timestamp: new Date('2026-09-06T13:00:00Z') },
      { type: ClockingType.OUT, timestamp: new Date('2026-09-06T20:00:00Z') },
    ]);
    mockPrisma.workShift.upsert.mockResolvedValue({});

    const result = await service.recalculateWorkShift('tenant-1', 'user-1', refDate);

    expect(result.totalWorkMinutes).toBe(660); // 11 horas
    expect(result.alerts.some((a) => a.includes('Limite legal diário de 10 horas de trabalho ultrapassado'))).toBe(true);
  });

  it('deve marcar jornada como incompleta caso falte a batida de saída', async () => {
    const refDate = new Date('2026-09-06T08:00:00Z');

    // Apenas Entrada registrada
    mockPrisma.timeClocking.findMany.mockResolvedValue([
      { type: ClockingType.IN, timestamp: new Date('2026-09-06T08:00:00Z') },
    ]);
    mockPrisma.workShift.upsert.mockResolvedValue({});

    const result = await service.recalculateWorkShift('tenant-1', 'user-1', refDate);

    expect(result.isComplete).toBe(false);
    expect(result.alerts.some((a) => a.includes('Jornada incompleta'))).toBe(true);
  });
});
