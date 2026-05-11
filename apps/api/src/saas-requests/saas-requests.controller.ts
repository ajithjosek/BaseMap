import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SaaSRequestsService } from './saas-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('saas-requests')
@UseGuards(JwtAuthGuard)
export class SaaSRequestsController {
  constructor(private readonly saasRequestsService: SaaSRequestsService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('state') state?: string,
    @Query('role') role?: string,
  ) {
    return this.saasRequestsService.findAll(user.tenantId, user.userId, { state, role });
  }

  @Get('pending-approvals')
  getPendingApprovals(@CurrentUser() user: any) {
    return this.saasRequestsService.getPendingApprovals(user.tenantId, user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.saasRequestsService.findOne(id, user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.saasRequestsService.create(user.tenantId, user.userId, dto);
  }

  @Put(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('comment') comment?: string,
  ) {
    return this.saasRequestsService.approve(id, user.tenantId, user.userId, { comment });
  }

  @Put(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('comment') comment: string,
  ) {
    return this.saasRequestsService.reject(id, user.tenantId, user.userId, { comment });
  }

  @Put(':id/request-changes')
  requestChanges(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('comment') comment: string,
  ) {
    return this.saasRequestsService.requestChanges(id, user.tenantId, user.userId, { comment });
  }
}