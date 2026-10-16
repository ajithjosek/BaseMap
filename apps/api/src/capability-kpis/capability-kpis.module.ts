import { Module } from '@nestjs/common';
import {
  CapabilityKpisController,
  CapabilityScopedKpisController,
} from './capability-kpis.controller';
import { CapabilityKpisService } from './capability-kpis.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CapabilityKpisController, CapabilityScopedKpisController],
  providers: [CapabilityKpisService],
  exports: [CapabilityKpisService],
})
export class CapabilityKpisModule {}
