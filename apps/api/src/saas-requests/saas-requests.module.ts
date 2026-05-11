import { Module } from '@nestjs/common';
import { SaaSRequestsController } from './saas-requests.controller';
import { SaaSRequestsService } from './saas-requests.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SaaSRequestsController],
  providers: [SaaSRequestsService],
  exports: [SaaSRequestsService],
})
export class SaaSRequestsModule {}