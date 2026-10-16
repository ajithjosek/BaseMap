import { Module } from '@nestjs/common';
import { CertReviewsController } from './cert-reviews.controller';
import { CertReviewsService } from './cert-reviews.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CertReviewsController],
  providers: [CertReviewsService],
  exports: [CertReviewsService],
})
export class CertReviewsModule {}
