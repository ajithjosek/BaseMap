import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { TransformationProjectsService } from './transformation-projects.service';
import { CreateTransformationProjectDto, UpdateTransformationProjectDto } from './dto/create-transformation-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('transformation-projects')
@UseGuards(JwtAuthGuard)
export class TransformationProjectsController {
  constructor(private readonly service: TransformationProjectsService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
  ) {
    return this.service.findAll(user.tenantId, { status, category, priority });
  }

  @Get('gantt')
  getGanttData(@CurrentUser() user: any) {
    return this.service.getGanttData(user.tenantId);
  }

  @Get('stats')
  getStats(@CurrentUser() user: any) {
    return this.service.getStats(user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateTransformationProjectDto) {
    return this.service.create(user.tenantId, dto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateTransformationProjectDto,
  ) {
    return this.service.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.tenantId);
  }
}