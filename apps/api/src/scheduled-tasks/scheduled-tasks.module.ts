import { Module } from '@nestjs/common';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { CronService } from './cron.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ServiceNowModule } from '../service-now/service-now.module';

@Module({
  imports: [PrismaModule, ServiceNowModule],
  providers: [ScheduledTasksService, CronService],
  exports: [ScheduledTasksService],
})
export class ScheduledTasksModule {}