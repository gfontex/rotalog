import { Module } from '@nestjs/common';
import { BiometricsService } from './biometrics.service.js';
import { BiometricsController } from './biometrics.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [BiometricsController],
  providers: [BiometricsService],
  exports: [BiometricsService],
})
export class BiometricsModule {}
