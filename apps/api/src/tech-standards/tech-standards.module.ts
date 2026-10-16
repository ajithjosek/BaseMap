import { Module } from '@nestjs/common';
import { TechStandardsController } from './tech-standards.controller';
import { TechStandardsService } from './tech-standards.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TechStandardsController],
  providers: [TechStandardsService],
  exports: [TechStandardsService],
})
export class TechStandardsModule {}
