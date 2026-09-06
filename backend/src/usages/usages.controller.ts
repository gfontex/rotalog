import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsagesService } from './usages.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/usages')
export class UsagesController {
  constructor(private readonly usagesService: UsagesService) {}

  @Get()
  @Roles(Role.DRIVER, Role.FLEET_MANAGER, Role.HR, Role.ADMIN)
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('driverId') driverId?: string,
  ) {
    return this.usagesService.findAll(tenantId, vehicleId, driverId);
  }

  @Get('active')
  @Roles(Role.DRIVER, Role.FLEET_MANAGER, Role.ADMIN)
  async getActiveUsage(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') driverId: string,
  ) {
    return this.usagesService.getActiveUsage(tenantId, driverId);
  }

  @Get('stats')
  @Roles(Role.FLEET_MANAGER, Role.ADMIN, Role.HR)
  async getFleetStats(@CurrentUser('tenantId') tenantId: string) {
    return this.usagesService.getFleetStats(tenantId);
  }

  @Get('notifications')
  @Roles(Role.ADMIN, Role.FLEET_MANAGER)
  async getNotifications(@CurrentUser('tenantId') tenantId: string) {
    return this.usagesService.getNotifications(tenantId);
  }

  @Post('start-pause')
  @Roles(Role.DRIVER, Role.FLEET_MANAGER, Role.ADMIN)
  async startPause(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') driverId: string,
  ) {
    return this.usagesService.startPause(tenantId, driverId);
  }

  @Post('end-pause')
  @Roles(Role.DRIVER, Role.FLEET_MANAGER, Role.ADMIN)
  async endPause(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') driverId: string,
  ) {
    return this.usagesService.endPause(tenantId, driverId);
  }
}
