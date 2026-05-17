import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { SaaSApplicationsService } from './saas-applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('saas-applications')
@UseGuards(JwtAuthGuard)
export class SaaSApplicationsController {
  constructor(private readonly saasService: SaaSApplicationsService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheKey('saas-applications-list')
  @CacheTTL(1800000)
  findAll(@CurrentUser() user: any, @Query('search') search?: string) {
    return this.saasService.findAll(user.tenantId, search);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.saasService.getStats(user.tenantId);
  }

  @Get('renewals')
  getRenewalCalendar(
    @CurrentUser() user: any,
    @Query('months') months?: string,
  ) {
    return this.saasService.getRenewalCalendar(user.tenantId, months ? parseInt(months) : 12);
  }

  @Get('utilization')
  getUtilizationStats(@CurrentUser() user: any) {
    return this.saasService.getUtilizationStats(user.tenantId);
  }

  @Get('inactive-users')
  getInactiveUsers(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    return this.saasService.getInactiveUsers(user.tenantId, days ? parseInt(days) : 90);
  }

  @Get('inactive-users/export')
  async exportInactiveUsers(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    const data = await this.saasService.getInactiveUsers(user.tenantId, days ? parseInt(days) : 90);
    const csv = this.saasService.generateInactiveUsersCSV(data);
    
    return {
      data: csv,
      filename: `inactive-users-${new Date().toISOString().split('T')[0]}.csv`,
      contentType: 'text/csv',
    };
  }

  @Get('spend/breakdown')
  getSpendBreakdown(@CurrentUser() user: any) {
    return this.saasService.getSpendBreakdown(user.tenantId);
  }

  @Get('spend/trend')
  getSpendTrend(
    @CurrentUser() user: any,
    @Query('period') period?: string,
  ) {
    return this.saasService.getSpendTrend(user.tenantId, period || 'monthly');
  }

  @Get('spend/concentration')
  getVendorConcentration(@CurrentUser() user: any) {
    return this.saasService.getVendorConcentration(user.tenantId);
  }

  @Get('utilization/trend')
  getUtilizationTrend(
    @CurrentUser() user: any,
    @Query('appId') appId?: string,
  ) {
    return this.saasService.getUtilizationTrend(user.tenantId, appId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.saasService.findOne(id, user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.saasService.create(user.tenantId, user.userId, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: any) {
    return this.saasService.update(id, user.tenantId, dto);
  }

  @Put(':id/seats')
  updateSeats(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('totalSeats') totalSeats: number,
    @Body('activeUsers') activeUsers: number,
  ) {
    return this.saasService.updateSeats(id, user.tenantId, totalSeats, activeUsers);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.saasService.remove(id, user.tenantId);
  }
}
