import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { GapsService } from './gaps.service';
import { CreateGapDto, UpdateGapDto } from './dto/gap.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('capabilities/gaps')
@UseGuards(JwtAuthGuard)
export class GapsController {
  constructor(private readonly gapsService: GapsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateGapDto) {
    return this.gapsService.create(req.tenantId, dto, req.user?.id);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('capabilityId') capabilityId?: string,
  ) {
    return this.gapsService.findAll(req.tenantId, { status, severity, capabilityId });
  }

  @Get('stats')
  getStats(@Req() req: any) {
    return this.gapsService.getGapStats(req.tenantId);
  }

  @Get('trend')
  getTrend(
    @Req() req: any,
    @Query('months') months?: string,
  ) {
    return this.gapsService.getGapTrend(req.tenantId, months ? parseInt(months) : 12);
  }

  @Post('detect')
  autoDetectGaps(@Req() req: any) {
    return this.gapsService.autoCreateGaps(req.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gapsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateGapDto,
  ) {
    return this.gapsService.update(id, req.tenantId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.gapsService.remove(id, req.tenantId);
  }
}