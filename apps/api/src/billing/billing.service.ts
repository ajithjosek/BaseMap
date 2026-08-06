import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';

export const PLAN_PRICES_MAP: Record<string, string> = {
  starter: '',
  professional: '',
  enterprise: '',
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private stripe: Stripe | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = Boolean(process.env.STRIPE_SECRET_KEY);
    if (this.enabled) {
      try {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      } catch (err: any) {
        this.logger.warn(
          `Billing disabled: invalid STRIPE_SECRET_KEY (${err?.message})`,
        );
        this.enabled = false;
      }
    } else {
      this.logger.warn(
        'Billing is in stub mode (no STRIPE_SECRET_KEY). All billing operations return stubbed data.',
      );
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async createCustomer(tenantId: string, email: string, name: string): Promise<any> {
    if (!this.enabled || !this.stripe) {
      return this.stubCustomer(tenantId, email, name);
    }
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata: { tenantId },
    });
    return customer;
  }

  async mapPlanToPrice(plan: string): Promise<any> {
    const priceId = PLAN_PRICES_MAP[plan] || '';
    if (!this.enabled || !this.stripe || !priceId) {
      return null;
    }
    return this.stripe.prices.retrieve(priceId);
  }

  /** Create or update a subscription for a tenant plan. */
  async ensureSubscription(customerId: string, plan: string): Promise<any> {
    if (!this.enabled || !this.stripe) {
      return { stub: true, customerId, plan };
    }
    const priceId = PLAN_PRICES_MAP[plan];
    if (!priceId) {
      this.logger.warn(`No Stripe price configured for plan '${plan}'`);
      return null;
    }
    const subscriptions = await this.stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
    });
    const sub = subscriptions.data[0];
    if (sub) {
      return this.stripe.subscriptions.update(sub.id, {
        items: [{ id: sub.items.data[0].id, price: priceId }],
      });
    }
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    });
  }

  async createBillingPortalSession(customerId: string): Promise<any> {
    if (!this.enabled || !this.stripe) {
      return {
        stub: true,
        url: `${process.env.APP_URL || 'http://localhost:3005'}/settings/billing`,
      };
    }
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL || 'http://localhost:3005'}/settings/billing`,
    });
    return { url: session.url };
  }

  /**
   * Validates and extracts the subscription event from an incoming Stripe
   * webhook. When disabled, returns null so consumers can skip gracefully.
   */
  async handleWebhook(rawBody: string, signature: string): Promise<Stripe.Event | null> {
    if (!this.enabled || !this.stripe) {
      this.logger.warn('Received billing webhook while billing disabled; ignoring.');
      return null;
    }
    const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
    if (!secret) {
      this.logger.warn('Missing STRIPE_WEBHOOK_SECRET; webhook signature unchecked.');
      return JSON.parse(rawBody) as Stripe.Event;
    }
    try {
      return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err?.message}`);
      throw new Error('Invalid webhook signature');
    }
  }

  private stubCustomer(tenantId: string, email: string, name: string) {
    return {
      id: `cus_stub_${tenantId}`,
      object: 'customer',
      email,
      name,
      metadata: { tenantId },
      stub: true,
    };
  }
}