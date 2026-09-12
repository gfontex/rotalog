import { Module } from '@nestjs/common';
import { TimeclockService } from './timeclock.service.js';
import { TimeclockController } from './timeclock.controller.js';
@Module({
  imports: [],
  controllers: [TimeclockController],
  providers: [TimeclockService],
  exports: [TimeclockService],
})
export class TimeclockModule {}
