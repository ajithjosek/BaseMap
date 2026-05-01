import { Module } from '@nestjs/common';
import { InterfacesService } from './interfaces.service';
import { InterfacesController } from './interfaces.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InterfacesController],
  providers: [InterfacesService],
})
export class InterfacesModule {}
