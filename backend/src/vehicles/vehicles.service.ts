import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { VehicleStatus } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, status?: VehicleStatus, branchId?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;

    return this.prisma.vehicle.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, tenantId },
      include: {
        branch: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Veículo não encontrado na frota.');
    }

    return vehicle;
  }

  async create(tenantId: string, dto: CreateVehicleDto) {
    const existing = await this.prisma.vehicle.findFirst({
      where: { plate: dto.plate.toUpperCase().trim() },
    });

    if (existing) {
      throw new ConflictException('Já existe um veículo cadastrado com esta placa.');
    }

    return this.prisma.vehicle.create({
      data: {
        plate: dto.plate.toUpperCase().trim(),
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        status: dto.status || VehicleStatus.AVAILABLE,
        currentMileage: dto.currentMileage || 0,
        tenantId,
        branchId: dto.branchId || null,
      },
      include: {
        branch: true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateVehicleDto) {
    await this.findOne(tenantId, id);

    const updateData: any = {};
    if (dto.plate) updateData.plate = dto.plate.toUpperCase().trim();
    if (dto.brand) updateData.brand = dto.brand;
    if (dto.model) updateData.model = dto.model;
    if (dto.year) updateData.year = dto.year;
    if (dto.status) updateData.status = dto.status;
    if (dto.currentMileage !== undefined) updateData.currentMileage = dto.currentMileage;
    if (dto.branchId !== undefined) updateData.branchId = dto.branchId || null;

    return this.prisma.vehicle.update({
      where: { id },
      data: updateData,
      include: {
        branch: true,
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.vehicle.delete({
      where: { id },
    });
  }
}
