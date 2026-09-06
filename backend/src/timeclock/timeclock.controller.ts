import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { TimeclockService } from './timeclock.service.js';
import { CreateClockingDto } from './dto/create-clocking.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/timeclock')
export class TimeclockController {
  constructor(private readonly timeclockService: TimeclockService) {}

  @Post('punch')
  @Roles(Role.DRIVER, Role.HR, Role.FLEET_MANAGER, Role.ADMIN)
  async punch(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateClockingDto,
  ) {
    return this.timeclockService.punch(tenantId, userId, dto);
  }

  @Get('my-timesheet')
  @Roles(Role.DRIVER, Role.HR, Role.FLEET_MANAGER, Role.ADMIN)
  async getMyTimesheet(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const now = new Date();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const y = year ? parseInt(year, 10) : now.getFullYear();
    return this.timeclockService.getTimesheet(tenantId, userId, m, y);
  }

  @Get('timesheet/:userId')
  @Roles(Role.HR, Role.ADMIN)
  async getTimesheet(
    @CurrentUser('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const now = new Date();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const y = year ? parseInt(year, 10) : now.getFullYear();
    return this.timeclockService.getTimesheet(tenantId, userId, m, y);
  }

  @Get('consolidated')
  @Roles(Role.HR, Role.ADMIN)
  async getConsolidatedReport(
    @CurrentUser('tenantId') tenantId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const now = new Date();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const y = year ? parseInt(year, 10) : now.getFullYear();
    return this.timeclockService.getConsolidatedReport(tenantId, m, y);
  }
}
