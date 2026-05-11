import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdvancedAnalyticsService } from './advanced-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('advanced-analytics')
@UseGuards(JwtAuthGuard)
export class AdvancedAnalyticsController {
  constructor(private readonly service: AdvancedAnalyticsService) {}

  @Get('widgets')
  getWidgets(
    @CurrentUser() user: any,
    @Query('shared') shared?: string,
  ) {
    return this.service.getWidgets(user.id, user.tenantId, shared === 'true');
  }

  @Post('widgets')
  createWidget(@CurrentUser() user: any, @Body() data: any) {
    return this.service.createWidget(user.id, user.tenantId, data);
  }

  @Put('widgets/:id')
  updateWidget(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() data: any,
  ) {
    return this.service.updateWidget(id, user.id, user.tenantId, data);
  }

  @Delete('widgets/:id')
  deleteWidget(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.deleteWidget(id, user.id, user.tenantId);
  }

  @Get('budget')
  getBudgetForecast(
    @CurrentUser() user: any,
    @Query('year') year?: string,
  ) {
    return this.service.getBudgetForecast(user.tenantId, year ? parseInt(year) : undefined);
  }

  @Post('budget')
  createBudgetForecast(@CurrentUser() user: any, @Body() data: any) {
    return this.service.createBudgetForecast(user.tenantId, data);
  }

  @Get('summary')
  getAnalyticsSummary(@CurrentUser() user: any) {
    return this.service.getAnalyticsSummary(user.tenantId);
  }

  @Get('cost-trend')
  getCostTrend(
    @CurrentUser() user: any,
    @Query('months') months?: string,
  ) {
    return this.service.getCostTrend(user.tenantId, months ? parseInt(months) : 12);
  }
}