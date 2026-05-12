import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('compliance')
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private readonly service: ComplianceService) {}

  @Get('frameworks')
  getFrameworks(
    @CurrentUser() user: any,
    @Query('type') type?: string,
  ) {
    return this.service.getFrameworks(user.tenantId, type);
  }

  @Post('frameworks')
  createFramework(@CurrentUser() user: any, @Body() data: any) {
    return this.service.createFramework(user.tenantId, data);
  }

  @Get('frameworks/:id/controls')
  getControls(@Param('id') id: string) {
    return this.service.getControls(id);
  }

  @Post('frameworks/:id/controls')
  createControl(@Param('id') id: string, @Body() data: any) {
    return this.service.createControl(id, data);
  }

  @Put('controls/:id')
  updateControl(@Param('id') id: string, @Body() data: any) {
    return this.service.updateControl(id, data);
  }

  @Get('dashboard')
  getDashboardSummary(@CurrentUser() user: any) {
    return this.service.getDashboardSummary(user.tenantId);
  }

  @Get('security')
  getSecurityAssessments(
    @CurrentUser() user: any,
    @Query('entity_type') entityType?: string,
  ) {
    return this.service.getSecurityAssessments(user.tenantId, entityType);
  }

  @Post('security')
  createSecurityAssessment(@CurrentUser() user: any, @Body() data: any) {
    return this.service.createSecurityAssessment(user.tenantId, data);
  }

  @Get('security/score')
  getSecurityScore(@CurrentUser() user: any) {
    return this.service.getSecurityScore(user.tenantId);
  }
}