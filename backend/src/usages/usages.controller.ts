import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UsagesService } from './usages.service';
import { StartUsageDto, FinishUsageDto } from './dto/usage.dto';

@Controller('usages')
export class UsagesController {
  constructor(private readonly usagesService: UsagesService) {}

  @Get()
  async findAll(@Query('tenantId') tenantId?: string) {
    return this.usagesService.findAll(tenantId);
  }

  @Get('driver/:driverId')
  async findByDriver(@Param('driverId') driverId: string) {
    return this.usagesService.findByDriver(driverId);
  }

  @Get('active/:driverId')
  async findActiveByDriver(@Param('driverId') driverId: string) {
    return this.usagesService.findActiveByDriver(driverId);
  }

  @Post('start')
  async startUsage(@Body() startUsageDto: StartUsageDto) {
    return this.usagesService.startUsage(startUsageDto);
  }

  @Patch(':id/pause-lunch')
  async pauseLunch(@Param('id') id: string) {
    return this.usagesService.pauseLunch(id);
  }

  @Patch(':id/resume-lunch')
  async resumeLunch(@Param('id') id: string) {
    return this.usagesService.resumeLunch(id);
  }

  @Post(':id/finish')
  async finishUsage(
    @Param('id') id: string,
    @Body() finishUsageDto: FinishUsageDto,
  ) {
    return this.usagesService.finishUsage(id, finishUsageDto);
  }
}
