// Cadastro, inclusao, listagem e alteracao de status de veiculos (disponivel, em uso e oficina)

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleStatusDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId?: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: tenantId ? { tenantId } : {},
      include: {
        branch: true,
        usages: {
          where: { status: { in: ['IN_PROGRESS', 'PAUSED_LUNCH'] } },
          include: { driver: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return vehicles.map((v) => ({
      id: v.id,
      tenantId: v.tenantId,
      branchId: v.branchId,
      branchName: v.branch?.name || null,
      plate: v.plate,
      brand: v.brand,
      model: v.model,
      year: v.year,
      status: v.status, // "AVAILABLE" | "IN_USE" | "MAINTENANCE"
      isAvailable: v.status === 'AVAILABLE',
      currentMileage: v.currentMileage,
      currentDriver: v.usages[0]?.driver
        ? { id: v.usages[0].driver.id, name: v.usages[0].driver.name }
        : null,
    }));
  }

  async findAvailable(tenantId?: string) {
    const list = await this.findAll(tenantId);
    return list.filter((v) => v.status === 'AVAILABLE');
  }

  async findOne(id: string) {
    const v = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        usages: {
          where: { status: { in: ['IN_PROGRESS', 'PAUSED_LUNCH'] } },
          include: { driver: true },
          take: 1,
        },
      },
    });
    if (!v) {
      throw new NotFoundException(`Veículo ${id} não encontrado.`);
    }
    return {
      ...v,
      isAvailable: v.status === 'AVAILABLE',
      currentDriver: v.usages[0]?.driver
        ? { id: v.usages[0].driver.id, name: v.usages[0].driver.name }
        : null,
    };
  }

  async create(dto: CreateVehicleDto) {
    let tenantId = dto.tenantId;
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst();
      if (!defaultTenant) {
        throw new NotFoundException('Nenhuma empresa/base cadastrada.');
      }
      tenantId = defaultTenant.id;
    }

    const normalizedPlate = dto.plate.toUpperCase().trim();
    const existing = await this.prisma.vehicle.findUnique({
      where: { plate: normalizedPlate },
    });
    if (existing) {
      throw new ConflictException(`Já existe uma viatura cadastrada com a placa ${normalizedPlate}.`);
    }

    return this.prisma.vehicle.create({
      data: {
        tenantId,
        branchId: dto.branchId || null,
        plate: normalizedPlate,
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        currentMileage: dto.currentMileage,
        status: dto.status || 'AVAILABLE',
      },
    });
  }

  async updateStatus(id: string, dto: UpdateVehicleStatusDto) {
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        status: dto.status,
        ...(dto.currentMileage !== undefined ? { currentMileage: dto.currentMileage } : {}),
      },
    });
  }
}
