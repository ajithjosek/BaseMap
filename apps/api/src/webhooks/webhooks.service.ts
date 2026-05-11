import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {
    this.db = this.prisma as any;
  }

  private db: any;

  async findAll(tenantId: string, provider?: string) {
    const where: any = { tenant_id: tenantId };
    if (provider) where.provider = provider;

    return this.db.webhookConfig.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const webhook = await this.db.webhookConfig.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');
    return webhook;
  }

  async create(tenantId: string, data: {
    name: string;
    provider: string;
    webhook_url: string;
    secret_key?: string;
    events?: string[];
  }) {
    return this.db.webhookConfig.create({
      data: {
        tenant_id: tenantId,
        name: data.name,
        provider: data.provider,
        webhook_url: data.webhook_url,
        secret_key: data.secret_key,
        events: data.events || [],
        is_active: true,
      },
    });
  }

  async update(id: string, tenantId: string, data: {
    name?: string;
    webhook_url?: string;
    secret_key?: string;
    events?: string[];
    is_active?: boolean;
  }) {
    await this.findOne(id, tenantId);

    return this.db.webhookConfig.update({
      where: { id },
      data: {
        name: data.name,
        webhook_url: data.webhook_url,
        secret_key: data.secret_key,
        events: data.events,
        is_active: data.is_active,
      },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.db.webhookConfig.delete({ where: { id } });
  }

  async test(id: string, tenantId: string) {
    const webhook = await this.findOne(id, tenantId);
    
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      message: 'This is a test webhook from BaseMap',
    };

    try {
      const response: any = await firstValueFrom(
        this.httpService.post(webhook.webhook_url, testPayload, {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Provider': webhook.provider,
            'X-Webhook-Test': 'true',
          },
        }),
      );
      return { success: true, message: 'Webhook test successful', status: response.status };
    } catch (error: any) {
      return { 
        success: false, 
        message: 'Webhook test failed', 
        error: error.response?.data || error.message 
      };
    }
  }

  async triggerWebhook(tenantId: string, event: string, data: any) {
    const webhooks = await this.db.webhookConfig.findMany({
      where: {
        tenant_id: tenantId,
        is_active: true,
      },
    });

    const results: any[] = [];
    for (const webhook of webhooks) {
      const events = webhook.events as string[];
      if (!events.includes(event) && !events.includes('*')) continue;

      try {
        const payload = {
          event,
          timestamp: new Date().toISOString(),
          data,
        };

        const response = await firstValueFrom(
          this.httpService.post(webhook.webhook_url, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Provider': webhook.provider,
            },
          }),
        );
        results.push({ webhook_id: webhook.id, success: true });
      } catch (error) {
        results.push({ webhook_id: webhook.id, success: false, error: error.message });
      }
    }

    return results;
  }

  getProviders() {
    return [
      { value: 'slack', label: 'Slack', icon: 'slack' },
      { value: 'teams', label: 'Microsoft Teams', icon: 'teams' },
      { value: 'discord', label: 'Discord', icon: 'discord' },
      { value: 'webhook', label: 'Generic Webhook', icon: 'webhook' },
    ];
  }

  getEventTypes() {
    return [
      { value: 'saas_renewal', label: 'SaaS Renewal Alert' },
      { value: 'eol_warning', label: 'End of Life Warning' },
      { value: 'security_alert', label: 'Security Alert' },
      { value: 'budget_threshold', label: 'Budget Threshold Exceeded' },
      { value: 'request_approved', label: 'Request Approved' },
      { value: 'request_rejected', label: 'Request Rejected' },
      { value: '*', label: 'All Events' },
    ];
  }
}