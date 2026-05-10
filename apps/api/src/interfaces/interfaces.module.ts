import { Module } from '@nestjs/common';
import { InterfacesService } from './interfaces.service';
import { InterfacesController } from './interfaces.controller';

@Module({
  providers: [InterfacesService],
  controllers: [InterfacesController]
})
export class InterfacesModule {}