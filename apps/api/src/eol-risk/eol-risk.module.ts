import { Module } from '@nestjs/common';
import { EOLRiskController } from './eol-risk.controller';
import { EOLRiskService } from './eol-risk.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EOLRiskController],
  providers: [EOLRiskService],
  exports: [EOLRiskService],
})
export class EOLRiskModule {}