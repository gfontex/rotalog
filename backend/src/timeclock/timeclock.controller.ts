import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TimeclockService } from './timeclock.service';
import { PunchClockDto, SyncTimeClocksDto } from './dto/timeclock.dto';

@Controller('timeclock')
export class TimeclockController {
  constructor(private readonly timeclockService: TimeclockService) {}

  @Post('punch')
  async punch(@Body() punchClockDto: PunchClockDto) {
    return this.timeclockService.punch(punchClockDto);
  }

  @Post('sync')
  async syncOffline(@Body() syncDto: SyncTimeClocksDto) {
    return this.timeclockService.syncOffline(syncDto);
  }

  @Get('today/:userId')
  async getTodayPunches(@Param('userId') userId: string) {
    return this.timeclockService.getTodayPunches(userId);
  }

  @Get('report')
  async getReport(@Query('tenantId') tenantId?: string) {
    return this.timeclockService.getReport(tenantId);
  }
}
