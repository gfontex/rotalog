import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleStatusDto } from './dto/create-vehicle.dto';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  async findAll(@Query('tenantId') tenantId?: string) {
    return this.vehiclesService.findAll(tenantId);
  }

  @Get('available')
  async findAvailable(@Query('tenantId') tenantId?: string) {
    return this.vehiclesService.findAvailable(tenantId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Post()
  async create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateVehicleStatusDto,
  ) {
    return this.vehiclesService.updateStatus(id, updateStatusDto);
  }
}
