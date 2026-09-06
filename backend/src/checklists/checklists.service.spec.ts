import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChecklistsService } from './checklists.service.js';
import { ChecklistType, VehicleStatus } from '@prisma/client';

describe('ChecklistsService', () => {
  let service: ChecklistsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      vehicle: {
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      vehicleChecklist: {
        create: vi.fn(),
      },
      vehicleUsage: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    };

    service = new ChecklistsService(mockPrisma);
  });

  it('deve realizar checklist de ENTRADA, atualizar veículo para IN_USE e iniciar sessão de uso', async () => {
    mockPrisma.vehicle.findFirst.mockResolvedValue({
      id: 'v1',
      plate: 'ABC-1234',
      currentMileage: 10000,
      status: VehicleStatus.AVAILABLE,
    });

    mockPrisma.vehicleChecklist.create.mockResolvedValue({
      id: 'chk-entry-1',
      type: ChecklistType.ENTRY,
      mileage: 10000,
      hasProblem: false,
    });

    mockPrisma.vehicle.update.mockResolvedValue({
      id: 'v1',
      status: VehicleStatus.IN_USE,
      currentMileage: 10000,
    });

    mockPrisma.vehicleUsage.create.mockResolvedValue({
      id: 'usage-1',
      startTime: new Date(),
    });

    const result = await service.create('tenant-1', 'driver-1', {
      vehicleId: 'v1',
      type: ChecklistType.ENTRY,
      mileage: 10000,
      itemsResult: { combustivel: true, pneus: true },
    });

    expect(result.message).toContain('Checklist de entrada concluído');
    expect(mockPrisma.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: VehicleStatus.IN_USE }),
      }),
    );
    expect(mockPrisma.vehicleUsage.create).toHaveBeenCalled();
  });

  it('deve realizar checklist de SAÍDA sem avaria, fechar sessão de uso e liberar veículo como AVAILABLE', async () => {
    mockPrisma.vehicle.findFirst.mockResolvedValue({
      id: 'v1',
      plate: 'ABC-1234',
      currentMileage: 10000,
      status: VehicleStatus.IN_USE,
    });

    mockPrisma.vehicleChecklist.create.mockResolvedValue({
      id: 'chk-exit-1',
      type: ChecklistType.EXIT,
      mileage: 10150,
      hasProblem: false,
    });

    const startTime = new Date(Date.now() - 120 * 60 * 1000); // 2 horas atrás
    mockPrisma.vehicleUsage.findFirst.mockResolvedValue({
      id: 'usage-1',
      startTime,
      entryChecklist: { mileage: 10000 },
    });

    mockPrisma.vehicleUsage.update.mockResolvedValue({});
    mockPrisma.vehicle.update.mockResolvedValue({
      id: 'v1',
      status: VehicleStatus.AVAILABLE,
      currentMileage: 10150,
    });

    const result = await service.create('tenant-1', 'driver-1', {
      vehicleId: 'v1',
      type: ChecklistType.EXIT,
      mileage: 10150,
      itemsResult: { combustivel: true, pneus: true },
    });

    expect(result.vehicleStatus).toBe(VehicleStatus.AVAILABLE);
    expect(result.usageCompleted?.totalDistanceKm).toBe(150); // 10150 - 10000 = 150 km
    expect(result.usageCompleted?.totalDurationMinutes).toBeGreaterThanOrEqual(119);
    expect(mockPrisma.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: VehicleStatus.AVAILABLE, currentMileage: 10150 }),
      }),
    );
  });

  it('deve direcionar o veículo para MANUTENÇÃO e gerar log de auditoria se checklist reportar avaria', async () => {
    mockPrisma.vehicle.findFirst.mockResolvedValue({
      id: 'v1',
      plate: 'ABC-1234',
      currentMileage: 10000,
      status: VehicleStatus.IN_USE,
    });

    mockPrisma.vehicleChecklist.create.mockResolvedValue({
      id: 'chk-exit-2',
      type: ChecklistType.EXIT,
      mileage: 10050,
      hasProblem: true,
    });

    mockPrisma.vehicleUsage.findFirst.mockResolvedValue(null);
    mockPrisma.vehicle.update.mockResolvedValue({
      id: 'v1',
      status: VehicleStatus.MAINTENANCE,
      currentMileage: 10050,
    });
    mockPrisma.auditLog.create.mockResolvedValue({});

    const result = await service.create('tenant-1', 'driver-1', {
      vehicleId: 'v1',
      type: ChecklistType.EXIT,
      mileage: 10050,
      itemsResult: { combustivel: true, pneus: false }, // Pneu com problema!
      observation: 'Pneu traseiro esquerdo furado',
    });

    expect(result.vehicleStatus).toBe(VehicleStatus.MAINTENANCE);
    expect(mockPrisma.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: VehicleStatus.MAINTENANCE }),
      }),
    );
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'ALERTA_AVARIA_VEICULO' }),
      }),
    );
  });
});
