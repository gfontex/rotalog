import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { BiometricsService } from './biometrics.service.js';
import { EnrollBiometricsDto } from './dto/enroll-biometrics.dto.js';
import { VerifyBiometricsDto } from './dto/verify-biometrics.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/biometrics')
export class BiometricsController {
  constructor(private readonly biometricsService: BiometricsService) {}

  @Post('enroll')
  @Roles(Role.HR, Role.ADMIN)
  async enroll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') authorId: string,
    @Body() dto: EnrollBiometricsDto,
  ) {
    return this.biometricsService.enroll(tenantId, authorId, dto);
  }

  @Post('verify')
  @Roles(Role.DRIVER, Role.HR, Role.ADMIN)
  async verify(@CurrentUser('tenantId') tenantId: string, @Body() dto: VerifyBiometricsDto) {
    return this.biometricsService.verify(tenantId, dto);
  }

  @Get(':userId/status')
  @Roles(Role.DRIVER, Role.HR, Role.ADMIN, Role.FLEET_MANAGER)
  async getStatus(@CurrentUser('tenantId') tenantId: string, @Param('userId') userId: string) {
    return this.biometricsService.getStatus(tenantId, userId);
  }

  @Delete(':userId')
  @Roles(Role.HR, Role.ADMIN)
  async deleteBiometrics(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') authorId: string,
    @Param('userId') userId: string,
  ) {
    return this.biometricsService.deleteBiometrics(tenantId, authorId, userId);
  }
}
