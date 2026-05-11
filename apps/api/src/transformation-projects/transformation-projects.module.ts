import { Module } from '@nestjs/common';
import { TransformationProjectsController } from './transformation-projects.controller';
import { TransformationProjectsService } from './transformation-projects.service';

@Module({
  controllers: [TransformationProjectsController],
  providers: [TransformationProjectsService],
  exports: [TransformationProjectsService],
})
export class TransformationProjectsModule {}