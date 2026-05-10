import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface ReportFilters {
  businessUnitId?: string;
  lifecycleState?: string;
  ownerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('landscape')
  getApplicationLandscapeReport(@Req() req: any, @Query() filters: ReportFilters) {
    return this.reportsService.generateApplicationLandscapeReport(req.tenantId, filters);
  }

  @Get('capability-coverage')
  getCapabilityCoverageReport(@Req() req: any, @Query() filters: ReportFilters) {
    return this.reportsService.generateCapabilityCoverageReport(req.tenantId, filters);
  }

  @Get('it-cost')
  getItCostReport(@Req() req: any, @Query() filters: ReportFilters) {
    return this.reportsService.generateItCostReport(req.tenantId, filters);
  }

  @Get('eol-risk')
  getEolRiskReport(@Req() req: any, @Query() filters: ReportFilters) {
    return this.reportsService.generateEolRiskReport(req.tenantId, filters);
  }

  @Get('history')
  getReportHistory(@Req() req: any, @Query('limit') limit?: string) {
    return this.reportsService.getReportHistory(req.tenantId, limit ? parseInt(limit) : 10);
  }
}