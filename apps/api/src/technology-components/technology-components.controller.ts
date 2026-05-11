import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TechnologyComponentsService } from './technology-components.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('technology-components')
@UseGuards(JwtAuthGuard)
export class TechnologyComponentsController {
  constructor(private readonly componentsService: TechnologyComponentsService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('type') type?: string,
    @Query('environment') environment?: string,
  ) {
    return this.componentsService.findAll(user.tenantId, { type, environment });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.componentsService.findOne(id, user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.componentsService.create(user.tenantId, user.userId, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: any) {
    return this.componentsService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.componentsService.remove(id, user.tenantId);
  }

  @Post(':id/link/:applicationId')
  linkToApplication(
    @Param('id') id: string,
    @Param('applicationId') applicationId: string,
    @CurrentUser() user: any,
  ) {
    return this.componentsService.linkToApplication(id, user.tenantId, applicationId);
  }

  @Delete(':id/unlink/:applicationId')
  unlinkFromApplication(
    @Param('id') id: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.componentsService.unlinkFromApplication(id, applicationId);
  }

  @Post(':id/dependencies')
  addDependency(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: { toComponentId: string; type?: string; description?: string },
  ) {
    return this.componentsService.addDependency(
      user.tenantId,
      id,
      dto.toComponentId,
      dto.type,
      dto.description,
    );
  }

  @Delete('dependencies/:dependencyId')
  removeDependency(@Param('dependencyId') id: string, @CurrentUser() user: any) {
    return this.componentsService.removeDependency(id, user.tenantId);
  }

  @Get(':id/cloud-readiness')
  getCloudReadiness(@Param('id') id: string, @CurrentUser() user: any) {
    return this.componentsService.getCloudReadiness(user.tenantId, id);
  }
}