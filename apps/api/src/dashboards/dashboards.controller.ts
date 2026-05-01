import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboards')
@UseGuards(JwtAuthGuard)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('executive')
  getExecutiveMetrics() {
    return this.dashboardsService.getExecutiveMetrics();
  }

  @Get('financial')
  getFinancialMetrics() {
    return this.dashboardsService.getFinancialMetrics();
  }

  @Get('risk')
  getRiskMetrics() {
    return this.dashboardsService.getRiskMetrics();
  }
}
