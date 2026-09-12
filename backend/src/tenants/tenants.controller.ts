import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async findAll() {
    return this.tenantsService.findAll();
  }

  @Post()
  async create(
    @Body()
    body: {
      name: string;
      cnpj?: string;
      adminName: string;
      adminCpf: string;
      adminEmail: string;
      adminPassword?: string;
    },
  ) {
    return this.tenantsService.create(body);
  }

  @Get('branches')
  async getBranches(@Query('tenantId') tenantId?: string) {
    return this.tenantsService.getBranches(tenantId);
  }
}
