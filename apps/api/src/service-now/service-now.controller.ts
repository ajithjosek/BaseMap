import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { ServiceNowService } from './service-now.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('service-now')
@UseGuards(JwtAuthGuard)
export class ServiceNowController {
  constructor(private readonly serviceNowService: ServiceNowService) {}

  @Get('config')
  getConfig(@CurrentUser() user: any) {
    return this.serviceNowService.getConfig(user.tenantId);
  }

  @Put('config')
  saveConfig(@CurrentUser() user: any, @Body() dto: any) {
    return this.serviceNowService.saveConfig(user.tenantId, dto);
  }

  @Post('test')
  testConnection(@CurrentUser() user: any) {
    return this.serviceNowService.testConnection(user.tenantId);
  }

  @Post('sync')
  triggerSync(@CurrentUser() user: any) {
    return this.serviceNowService.triggerSync(user.tenantId);
  }

  @Get('logs')
  getSyncLogs(
    @CurrentUser() user: any,
  ) {
    return this.serviceNowService.getSyncLogs(user.tenantId);
  }
}