import { Controller, Get, Patch, Param, Post, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '../auth/guards/permissions.guard';

@Controller('alerts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @Permissions('dashboard.view')
  async findAll() {
    return this.alertsService.findAll();
  }

  @Get('unread-count')
  @Permissions('dashboard.view')
  async getUnreadCount() {
    return this.alertsService.getUnreadCount();
  }

  @Patch(':id/read')
  @Permissions('dashboard.view')
  async markAsRead(@Param('id') id: string) {
    return this.alertsService.markAsRead(BigInt(id));
  }

  @Post('read-all')
  @Permissions('dashboard.view')
  async markAllAsRead() {
    return this.alertsService.markAllAsRead();
  }
}
