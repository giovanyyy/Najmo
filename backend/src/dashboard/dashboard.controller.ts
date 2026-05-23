import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles('Administrateur', 'Comptable', 'ADMIN', 'ACCOUNTANT')
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('alerts')
  @Roles('Administrateur', 'Comptable', 'ADMIN', 'ACCOUNTANT')
  async getAlerts() {
    return this.dashboardService.getAlerts();
  }

  @Get('charts/revenue')
  @Roles('Administrateur', 'Comptable', 'ADMIN', 'ACCOUNTANT')
  async getCharts() {
    return this.dashboardService.getMonthlyRevenue();
  }
}
