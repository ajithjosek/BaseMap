import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('customer')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createCustomer(@CurrentUser() user: any): Promise<any> {
    return this.billingService.createCustomer(
      user.tenantId,
      user.email,
      'BaseMap Customer',
    );
  }

  @Post('subscription')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async ensureSubscription(@Body('customerId') customerId: string, @Body('plan') plan: string): Promise<any> {
    if (!customerId || !plan) {
      throw new BadRequestException('customerId and plan are required');
    }
    return this.billingService.ensureSubscription(customerId, plan);
  }

  @Post('portal-session')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async portalSession(@Body('customerId') customerId: string) {
    if (!customerId) throw new BadRequestException('customerId required');
    return this.billingService.createBillingPortalSession(customerId);
  }

  /** Stripe webhook endpoint (public; validated by signature). */
  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<any>) {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.rawBody?.toString('utf-8') || JSON.stringify(req.body);
    const event = await this.billingService.handleWebhook(rawBody, signature);
    if (!event) {
      return { received: true, ignored: true };
    }
    // TODO(Sprint 36): reconcile subscription events with tenant plan changes
    return { received: true, type: event.type };
  }
}