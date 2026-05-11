import { Module } from '@nestjs/common';
import { AIRecommendationsController } from './ai-recommendations.controller';
import { AIRecommendationsService } from './ai-recommendations.service';

@Module({
  controllers: [AIRecommendationsController],
  providers: [AIRecommendationsService],
  exports: [AIRecommendationsService],
})
export class AIRecommendationsModule {}