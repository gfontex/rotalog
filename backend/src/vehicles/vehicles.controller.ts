import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { Role, VehicleStatus } from '@prisma/client';
import { VehiclesService } from './vehicles.service.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @Roles(Role.DRIVER, Role.FLEET_MANAGER, Role.HR, Role.ADMIN)
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('status') status?: VehicleStatus,
    @Query('branchId') branchId?: string,
  ) {
    return this.vehiclesService.findAll(tenantId, status, branchId);
  }

  @Get(':id')
  @Roles(Role.DRIVER, Role.FLEET_MANAGER, Role.HR, Role.ADMIN)
  async findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.vehiclesService.findOne(tenantId, id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.FLEET_MANAGER)
  async create(@CurrentUser('tenantId') tenantId: string, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(tenantId, dto);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.FLEET_MANAGER)
  async update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.FLEET_MANAGER)
  async remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.vehiclesService.remove(tenantId, id);
  }
}
