import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistDto } from './dto/create-checklist.dto';

@Controller('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Get('template')
  getTemplate() {
    return this.checklistsService.getTemplate();
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
