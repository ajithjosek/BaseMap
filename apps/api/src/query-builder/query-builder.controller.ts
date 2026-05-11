import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { QueryBuilderService } from './query-builder.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('query-builder')
@UseGuards(JwtAuthGuard)
export class QueryBuilderController {
  constructor(private readonly queryBuilderService: QueryBuilderService) {}

  @Get('entities')
  getEntities(@CurrentUser() user: any) {
    return this.queryBuilderService.getEntities();
  }

  @Post('execute')
  executeQuery(@CurrentUser() user: any, @Body() config: any) {
    return this.queryBuilderService.executeQuery(user.tenantId, user.userId, config);
  }

  @Get('insights')
  getInsights(@CurrentUser() user: any) {
    return this.queryBuilderService.getInsights(user.tenantId, user.userId);
  }

  @Post('insights')
  saveInsight(@CurrentUser() user: any, @Body() data: any) {
    return this.queryBuilderService.saveInsight(user.tenantId, user.userId, data);
  }

  @Delete('insights/:id')
  deleteInsight(@Param('id') id: string, @CurrentUser() user: any) {
    return this.queryBuilderService.deleteInsight(id, user.tenantId, user.userId);
  }

  @Get('history')
  getHistory(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.queryBuilderService.getQueryHistory(user.tenantId, user.userId, limit ? parseInt(limit) : 20);
  }
}

@Controller('shared')
export class SharedController {
  constructor(private readonly queryBuilderService: QueryBuilderService) {}

  @Get('insight/:token')
  getSharedInsight(@Param('token') token: string) {
    return this.queryBuilderService.getInsightByShareToken(token);
  }
}