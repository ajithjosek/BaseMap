import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin/reporting')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('overview')
  overview() {
    return this.reportingService.crossTenantOverview();
  }
}
