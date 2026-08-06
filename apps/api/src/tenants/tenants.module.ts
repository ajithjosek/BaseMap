import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantExportService } from './tenants-export.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [PrismaModule, AuditLogsModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantExportService],
  exports: [TenantsService, TenantExportService],
})
export class TenantsModule {}
