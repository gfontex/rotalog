import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { BiometricsService } from './biometrics.service.js';
import { EnrollBiometricsDto } from './dto/enroll-biometrics.dto.js';
import { VerifyBiometricsDto } from './dto/verify-biometrics.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@Controller('api/biometrics')
export class BiometricsController {
  constructor(private readonly biometricsService: BiometricsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('enroll')
  @Roles(Role.HR, Role.ADMIN)
  async enroll(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') authorId: string,
    @Body() dto: EnrollBiometricsDto,
  ) {
    return this.biometricsService.enroll(tenantId, authorId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('verify')
  @Roles(Role.DRIVER, Role.HR, Role.ADMIN)
  async verify(@CurrentUser('tenantId') tenantId: string, @Body() dto: VerifyBiometricsDto) {
    return this.biometricsService.verify(tenantId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':userId/status')
  @Roles(Role.DRIVER, Role.HR, Role.ADMIN, Role.FLEET_MANAGER)
  async getStatus(@CurrentUser('tenantId') tenantId: string, @Param('userId') userId: string) {
    return this.biometricsService.getStatus(tenantId, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':userId')
  @Roles(Role.HR, Role.ADMIN)
  async deleteBiometrics(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') authorId: string,
    @Param('userId') userId: string,
  ) {
    return this.biometricsService.deleteBiometrics(tenantId, authorId, userId);
  }

  @Post('process-face')
  async processFace(
    @Body()
    body: {
      imageBase64: string;
      enrolledVector?: number[];
      mode?: 'ENROLL' | 'VERIFY';
    },
  ) {
    return this.biometricsService.processFaceImage(
      body.imageBase64,
      body.enrolledVector,
      body.mode ?? 'VERIFY',
    );
  }
}
