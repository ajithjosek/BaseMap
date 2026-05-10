import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { InterfacesService } from './interfaces.service';
import { CreateInterfaceDto, UpdateInterfaceDto, CreateIncidentDto } from './dto/interface.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('interfaces')
@UseGuards(JwtAuthGuard)
export class InterfacesController {
  constructor(private readonly interfacesService: InterfacesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateInterfaceDto) {
    return this.interfacesService.create(req.tenantId, dto, req.user?.id);
  }

  @Get()
  findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('sourceAppId') sourceAppId?: string,
    @Query('targetAppId') targetAppId?: string,
  ) {
    return this.interfacesService.findAll(req.tenantId, { search, type, status, sourceAppId, targetAppId });
  }

  @Get('stats')
  getStats(@Req() req: any) {
    return this.interfacesService.getStats(req.tenantId);
  }

  @Get('lineage/:id')
  getLineage(@Param('id') id: string, @Req() req: any) {
    return this.interfacesService.getLineage(id, req.tenantId);
  }

  @Get('incidents')
  getIncidents(@Req() req: any, @Query('interfaceId') interfaceId?: string) {
    return this.interfacesService.getIncidents(req.tenantId, interfaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.interfacesService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateInterfaceDto,
  ) {
    return this.interfacesService.update(id, req.tenantId, dto);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body('status') status: string,
  ) {
    return this.interfacesService.updateStatus(id, req.tenantId, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.interfacesService.remove(id, req.tenantId);
  }

  @Post(':id/incidents')
  createIncident(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: CreateIncidentDto,
  ) {
    return this.interfacesService.createIncident(req.tenantId, id, dto, req.user?.id);
  }

  @Put('incidents/:incidentId/resolve')
  resolveIncident(
    @Param('incidentId') incidentId: string,
    @Req() req: any,
    @Body('resolutionNotes') resolutionNotes: string,
  ) {
    return this.interfacesService.resolveIncident(incidentId, req.tenantId, resolutionNotes);
  }
}