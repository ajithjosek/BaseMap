import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CapabilitiesService } from './capabilities.service';
import { CreateCapabilityDto, UpdateCapabilityDto, MapApplicationDto } from './dto/create-capability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('capabilities')
@UseGuards(JwtAuthGuard)
export class CapabilitiesController {
  constructor(private readonly capabilitiesService: CapabilitiesService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createCapabilityDto: CreateCapabilityDto) {
    return this.capabilitiesService.create(user.tenantId, createCapabilityDto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.capabilitiesService.findAll(req.tenantId);
  }

  @Get('tree')
  getTree(@Req() req: any) {
    return this.capabilitiesService.getTree(req.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.capabilitiesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCapabilityDto: UpdateCapabilityDto) {
    return this.capabilitiesService.update(id, updateCapabilityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.capabilitiesService.remove(id);
  }

  @Post(':id/map')
  mapApplication(@Param('id') id: string, @Body() dto: MapApplicationDto) {
    return this.capabilitiesService.mapApplication(id, dto);
  }

  @Delete(':id/map/:appId')
  unmapApplication(@Param('id') id: string, @Param('appId') appId: string) {
    return this.capabilitiesService.unmapApplication(id, appId);
  }
}
