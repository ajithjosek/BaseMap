import { Module } from '@nestjs/common';
import { TechnologyComponentsController } from './technology-components.controller';
import { TechnologyComponentsService } from './technology-components.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TechnologyComponentsController],
  providers: [TechnologyComponentsService],
  exports: [TechnologyComponentsService],
})
export class TechnologyComponentsModule {}