import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { ChecklistsService } from './checklists.service.js';
import { CreateChecklistDto } from './dto/create-checklist.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Post()
  @Roles(Role.DRIVER, Role.FLEET_MANAGER, Role.ADMIN)
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') driverId: string,
    @Body() dto: CreateChecklistDto,
  ) {
    return this.checklistsService.create(tenantId, driverId, dto);
  }

  @Get()
  @Roles(Role.DRIVER, Role.FLEET_MANAGER, Role.HR, Role.ADMIN)
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('driverId') driverId?: string,
    @Query('hasProblem') hasProblem?: string,
  ) {
    return this.checklistsService.findAll(tenantId, {
      vehicleId,
      driverId,
      hasProblem: hasProblem !== undefined ? hasProblem === 'true' : undefined,
    });
  }

  @Get(':id')
  @Roles(Role.DRIVER, Role.FLEET_MANAGER, Role.HR, Role.ADMIN)
  async findOne(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.checklistsService.findOne(tenantId, id);
  }
}
