import { Module } from '@nestjs/common';
import { AdvancedAnalyticsController } from './advanced-analytics.controller';
import { AdvancedAnalyticsService } from './advanced-analytics.service';

@Module({
  controllers: [AdvancedAnalyticsController],
  providers: [AdvancedAnalyticsService],
  exports: [AdvancedAnalyticsService],
})
export class AdvancedAnalyticsModule {}
