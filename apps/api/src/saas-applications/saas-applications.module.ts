import { Module } from '@nestjs/common';
import { SaaSApplicationsService } from './saas-applications.service';
import { SaaSApplicationsController } from './saas-applications.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SaaSApplicationsController],
  providers: [SaaSApplicationsService],
  exports: [SaaSApplicationsService],
})
export class SaaSApplicationsModule {}
