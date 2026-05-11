import { Controller, Get, Post, Put, Param, Query, UseGuards } from '@nestjs/common';
import { AIRecommendationsService } from './ai-recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('ai-recommendations')
@UseGuards(JwtAuthGuard)
export class AIRecommendationsController {
  constructor(private readonly service: AIRecommendationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
    @Query('resolved') resolved?: string,
  ) {
    return this.service.findAll(user.tenantId, {
      category,
      priority,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
    });
  }

  @Get('dashboard')
  getDashboardSummary(@CurrentUser() user: any) {
    return this.service.getDashboardSummary(user.tenantId);
  }

  @Get('generate')
  generateInsights(@CurrentUser() user: any) {
    return this.service.generateInsights(user.tenantId);
  }

  @Post('generate-and-save')
  generateAndSave(@CurrentUser() user: any) {
    return this.service.generateInsights(user.tenantId).then(insights =>
      this.service.bulkCreate(user.tenantId, insights)
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.tenantId);
  }

  @Put(':id/resolve')
  resolve(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.resolve(id, user.tenantId);
  }
}