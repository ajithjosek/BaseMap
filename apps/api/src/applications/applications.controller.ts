import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/create-application.dto';
import { TransitionLifecycleDto } from './dto/transition-lifecycle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createApplicationDto: CreateApplicationDto) {
    return this.applicationsService.create(user.tenantId, createApplicationDto);
  }

  @Get()
  findAll(@Query() query: any, @Req() req: any) {
    return this.applicationsService.findAll(query, req.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateApplicationDto: UpdateApplicationDto) {
    return this.applicationsService.update(id, updateApplicationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(id);
  }

  @Post('bulk-delete')
  bulkDelete(@Body('ids') ids: string[]) {
    return this.applicationsService.bulkDelete(ids);
  }

  @Post(':id/transition')
  transitionLifecycle(
    @Param('id') id: string,
    @Body() dto: TransitionLifecycleDto,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.transitionLifecycle(id, dto, user.userId);
  }
}
