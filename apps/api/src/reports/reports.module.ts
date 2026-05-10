import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { CustomReportsService } from './custom-reports.service';
import { CustomReportsController } from './custom-reports.controller';

@Module({
  providers: [ReportsService, CustomReportsService],
  controllers: [ReportsController, CustomReportsController]
})
export class ReportsModule {}