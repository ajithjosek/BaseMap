import { Module } from '@nestjs/common';
import { ServiceNowController } from './service-now.controller';
import { ServiceNowService } from './service-now.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceNowController],
  providers: [ServiceNowService],
  exports: [ServiceNowService],
})
export class ServiceNowModule {}