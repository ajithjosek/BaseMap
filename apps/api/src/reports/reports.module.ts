import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { CustomReportsService } from './custom-reports.service';
import { CustomReportsController } from './custom-reports.controller';
import { PdfExportService } from './pdf-export.service';

@Module({
  providers: [ReportsService, CustomReportsService, PdfExportService],
  controllers: [ReportsController, CustomReportsController]
})
export class ReportsModule {}