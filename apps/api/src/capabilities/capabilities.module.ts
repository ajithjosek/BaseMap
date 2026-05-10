import { Module } from '@nestjs/common';
import { CapabilitiesService } from './capabilities.service';
import { CapabilitiesController } from './capabilities.controller';
import { GapsService } from './gaps.service';
import { GapsController } from './gaps.controller';

@Module({
  providers: [CapabilitiesService, GapsService],
  controllers: [CapabilitiesController, GapsController]
})
export class CapabilitiesModule {}
