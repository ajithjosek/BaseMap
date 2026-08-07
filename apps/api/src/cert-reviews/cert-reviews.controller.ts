import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CertReviewsService } from './cert-reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('certifications')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CertReviewsController {
  constructor(private readonly certReviews: CertReviewsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: any, @CurrentUser() user: any) {
    return this.certReviews.createCycle((req as any).tenantId, dto, user);
  }

  @Get()
  list(@Req() req: any) {
    return this.certReviews.listCycles((req as any).tenantId);
  }

  @Get('pending')
  pending(@Req() req: any, @CurrentUser() user: any) {
    return this.certReviews.pendingItems((req as any).tenantId, user.userId);
  }

  @Get(':id')
  one(@Req() req: any, @Param('id') id: string) {
    return this.certReviews.getCycle((req as any).tenantId, id);
  }

  @Patch(':id/complete')
  complete(@Req() req: any, @Param('id') id: string) {
    return this.certReviews.completeCycle((req as any).tenantId, id);
  }
}

@Controller('certifications/items')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CertReviewItemsController {
  constructor(private readonly certReviews: CertReviewsService) {}

  @Patch(':id')
  review(@Req() req: any, @Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.certReviews.reviewItem((req as any).tenantId, id, dto, user.userId);
  }
}