import { Module } from '@nestjs/common';
import { QueryBuilderController, SharedController } from './query-builder.controller';
import { QueryBuilderService } from './query-builder.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QueryBuilderController, SharedController],
  providers: [QueryBuilderService],
  exports: [QueryBuilderService],
})
export class QueryBuilderModule {}