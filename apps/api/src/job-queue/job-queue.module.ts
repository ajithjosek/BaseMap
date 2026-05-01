import { Module } from '@nestjs/common';
import { JobQueueService } from './job-queue.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [JobQueueService],
  exports: [JobQueueService],
})
export class JobQueueModule {}
