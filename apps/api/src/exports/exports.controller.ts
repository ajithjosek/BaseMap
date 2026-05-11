import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('exports')
@UseGuards(JwtAuthGuard)
export class ExportsController {
  constructor(private readonly service: ExportsService) {}

  @Get('templates')
  getTemplates(
    @CurrentUser() user: any,
    @Query('type') type?: string,
  ) {
    return this.service.getTemplates(user.tenantId, user.id, type);
  }

  @Post('templates')
  createTemplate(@CurrentUser() user: any, @Body() data: any) {
    return this.service.createTemplate(user.tenantId, user.id, data);
  }

  @Put('templates/:id')
  updateTemplate(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() data: any,
  ) {
    return this.service.updateTemplate(id, user.tenantId, user.id, data);
  }

  @Delete('templates/:id')
  deleteTemplate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.deleteTemplate(id, user.tenantId, user.id);
  }

  @Post('templates/:id/use')
  useTemplate(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.useTemplate(id, user.tenantId);
  }

  @Get('scheduled')
  getScheduledExports(@CurrentUser() user: any) {
    return this.service.getScheduledExports(user.tenantId, user.id);
  }

  @Post('scheduled')
  createScheduledExport(@CurrentUser() user: any, @Body() data: any) {
    return this.service.createScheduledExport(user.tenantId, user.id, data);
  }

  @Put('scheduled/:id')
  updateScheduledExport(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() data: any,
  ) {
    return this.service.updateScheduledExport(id, user.tenantId, user.id, data);
  }

  @Delete('scheduled/:id')
  deleteScheduledExport(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.deleteScheduledExport(id, user.tenantId, user.id);
  }

  @Put('scheduled/:id/toggle')
  toggleScheduledExport(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.toggleScheduledExport(id, user.tenantId, user.id);
  }

  @Post('generate')
  generateReport(
    @CurrentUser() user: any,
    @Query('templateId') templateId: string,
    @Query('format') format: string,
  ) {
    return this.service.generateReport(user.tenantId, templateId, format || 'json');
  }
}