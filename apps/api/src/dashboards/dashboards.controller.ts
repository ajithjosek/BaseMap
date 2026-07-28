import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('dashboards')
@UseGuards(JwtAuthGuard)
@UseInterceptors(CacheInterceptor)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('executive')
  @CacheKey('dashboards-executive')
  @CacheTTL(300000) // 5 minutes in ms
  getExecutiveMetrics() {
    return this.dashboardsService.getExecutiveMetrics();
  }

  @Get('financial')
  @CacheKey('dashboards-financial')
  @CacheTTL(300000)
  getFinancialMetrics() {
    return this.dashboardsService.getFinancialMetrics();
  }

  @Get('risk')
  @CacheKey('dashboards-risk')
  @CacheTTL(300000)
  getRiskMetrics() {
    return this.dashboardsService.getRiskMetrics();
  }
}
