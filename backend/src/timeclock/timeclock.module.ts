import { Module } from '@nestjs/common';
import { TimeclockService } from './timeclock.service';
import { TimeclockController } from './timeclock.controller';

@Module({
  controllers: [TimeclockController],
  providers: [TimeclockService],
  exports: [TimeclockService],
})
export class TimeclockModule {}
