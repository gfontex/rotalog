import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';

@Controller('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Get('template')
  getTemplate() {
    return this.checklistsService.getTemplate();
  }

  @Get('export-xlsx')
  async exportXlsx(
    @Query('tenantId') tenantId: string | undefined,
    @Res() res: Response,
  ) {
    const buffer = await this.checklistsService.exportXlsxBuffer(tenantId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="relatorio_checklists_frota.xlsx"',
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get()
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('driverId') driverId?: string,
  ) {
    return this.checklistsService.findAll(tenantId, driverId);
  }

  @Post()
  async create(@Body() createChecklistDto: CreateChecklistDto) {
    return this.checklistsService.create(createChecklistDto);
  }
}
