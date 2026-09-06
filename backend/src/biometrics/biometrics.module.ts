import { Module } from '@nestjs/common';
import { BiometricsService } from './biometrics.service.js';
import { BiometricsController } from './biometrics.controller.js';

@Module({
  controllers: [BiometricsController],
  providers: [BiometricsService],
  exports: [BiometricsService],
})
export class BiometricsModule {}
