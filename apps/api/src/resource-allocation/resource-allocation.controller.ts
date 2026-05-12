import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ResourceAllocationService } from './resource-allocation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('resource-allocation')
@UseGuards(JwtAuthGuard)
export class ResourceAllocationController {
  constructor(private readonly service: ResourceAllocationService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('user_id') user_id?: string,
    @Query('project_id') project_id?: string,
    @Query('active') active?: string,
  ) {
    return this.service.findAll(user.tenantId, {
      user_id,
      project_id,
      active: active === 'true' ? true : active === 'false' ? false : undefined,
    });
  }

  @Get('capacity')
  getTeamCapacity(@CurrentUser() user: any) {
    return this.service.getTeamCapacity(user.tenantId);
  }

  @Get('utilization')
  getUtilizationByDepartment(@CurrentUser() user: any) {
    return this.service.getUtilizationByDepartment(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() data: any) {
    return this.service.create(user.tenantId, data);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() data: any) {
    return this.service.update(id, user.tenantId, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user.tenantId);
  }
}