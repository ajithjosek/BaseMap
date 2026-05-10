import { Controller, Get, Query, UseGuards, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { PdfExportService } from './pdf-export.service';
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
  constructor(
    private readonly reportsService: ReportsService,
    private readonly pdfExportService: PdfExportService,
  ) {}

  @Get('landscape')
  getApplicationLandscapeReport(@Req() req: any, @Query() filters: ReportFilters) {
    return this.reportsService.generateApplicationLandscapeReport(req.tenantId, filters);
  }

  @Get('landscape/pdf')
  async getApplicationLandscapeReportPdf(
    @Req() req: any,
    @Query() filters: ReportFilters,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.generateApplicationLandscapeReport(req.tenantId, filters);
    const pdfBuffer = await this.pdfExportService.generateReportPdf('landscape', data, {
      title: 'Application Landscape Report',
      companyName: 'BaseMap',
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=application-landscape-report.pdf',
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get('capability-coverage')
  getCapabilityCoverageReport(@Req() req: any, @Query() filters: ReportFilters) {
    return this.reportsService.generateCapabilityCoverageReport(req.tenantId, filters);
  }

  @Get('capability-coverage/pdf')
  async getCapabilityCoverageReportPdf(
    @Req() req: any,
    @Query() filters: ReportFilters,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.generateCapabilityCoverageReport(req.tenantId, filters);
    const pdfBuffer = await this.pdfExportService.generateReportPdf('capability-coverage', data, {
      title: 'Capability Coverage Report',
      companyName: 'BaseMap',
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=capability-coverage-report.pdf',
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get('it-cost')
  getItCostReport(@Req() req: any, @Query() filters: ReportFilters) {
    return this.reportsService.generateItCostReport(req.tenantId, filters);
  }

  @Get('it-cost/pdf')
  async getItCostReportPdf(
    @Req() req: any,
    @Query() filters: ReportFilters,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.generateItCostReport(req.tenantId, filters);
    const pdfBuffer = await this.pdfExportService.generateReportPdf('it-cost', data, {
      title: 'IT Cost Report (TCO)',
      companyName: 'BaseMap',
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=it-cost-report.pdf',
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get('eol-risk')
  getEolRiskReport(@Req() req: any, @Query() filters: ReportFilters) {
    return this.reportsService.generateEolRiskReport(req.tenantId, filters);
  }

  @Get('eol-risk/pdf')
  async getEolRiskReportPdf(
    @Req() req: any,
    @Query() filters: ReportFilters,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.generateEolRiskReport(req.tenantId, filters);
    const pdfBuffer = await this.pdfExportService.generateReportPdf('eol-risk', data, {
      title: 'EOL Risk Report',
      companyName: 'BaseMap',
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=eol-risk-report.pdf',
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  }

  @Get('history')
  getReportHistory(@Req() req: any, @Query('limit') limit?: string) {
    return this.reportsService.getReportHistory(req.tenantId, limit ? parseInt(limit) : 10);
  }
}