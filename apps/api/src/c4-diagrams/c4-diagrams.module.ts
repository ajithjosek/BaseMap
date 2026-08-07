import { Module } from '@nestjs/common';
import { C4DiagramsController } from './c4-diagrams.controller';
import { C4DiagramsService } from './c4-diagrams.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [C4DiagramsController],
  providers: [C4DiagramsService],
  exports: [C4DiagramsService],
})
export class C4DiagramsModule {}