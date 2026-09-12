import { Controller, Get, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Query('tenantId') tenantId?: string) {
    return this.notificationsService.findAll(tenantId);
  }

  @Get('stats')
  async getDashboardStats(@Query('tenantId') tenantId?: string) {
    return this.notificationsService.getDashboardStats(tenantId);
  }
}
