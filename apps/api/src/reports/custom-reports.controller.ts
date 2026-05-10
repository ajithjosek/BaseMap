import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { CustomReportsService } from './custom-reports.service';
import { CreateCustomReportDto, UpdateCustomReportDto, ExecuteReportDto } from './dto/custom-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports/custom')
@UseGuards(JwtAuthGuard)
export class CustomReportsController {
  constructor(private readonly customReportsService: CustomReportsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateCustomReportDto) {
    return this.customReportsService.create(req.tenantId, req.user?.id, dto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.customReportsService.findAll(req.tenantId, req.user?.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.customReportsService.findOne(id, req.tenantId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateCustomReportDto,
  ) {
    return this.customReportsService.update(id, req.tenantId, req.user?.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.customReportsService.remove(id, req.tenantId, req.user?.id);
  }

  @Post(':id/execute')
  execute(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto?: ExecuteReportDto,
  ) {
    return this.customReportsService.executeReport(id, req.tenantId, dto);
  }

  @Get(':id/export')
  exportCsv(@Param('id') id: string, @Req() req: any) {
    return this.customReportsService.exportToCsv(id, req.tenantId);
  }

  @Post(':id/share')
  share(
    @Param('id') id: string,
    @Req() req: any,
    @Body('isShared') isShared: boolean,
  ) {
    return this.customReportsService.shareReport(id, req.tenantId, req.user?.id, isShared);
  }
}