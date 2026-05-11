import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('provider') provider?: string,
  ) {
    return this.service.findAll(user.tenantId, provider);
  }

  @Get('providers')
  getProviders() {
    return this.service.getProviders();
  }

  @Get('events')
  getEventTypes() {
    return this.service.getEventTypes();
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
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() data: any,
  ) {
    return this.service.update(id, user.tenantId, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.delete(id, user.tenantId);
  }

  @Post(':id/test')
  test(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.test(id, user.tenantId);
  }
}