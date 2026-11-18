import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
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

  @Get('export-xlsx')
  async exportXlsx(
    @Query('tenantId') tenantId: string | undefined,
    @Res() res: Response,
  ) {
    const buffer = await this.timeclockService.exportXlsxBuffer(tenantId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="relatorio_ponto_colaboradores.xlsx"',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
