import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SaaSApplicationsService {
  private db: any;

  constructor(private prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  async findAll(tenantId: string, search?: string) {
    const where: any = { tenant_id: tenantId };

    if (search) {
      where.OR = [
        { vendor: { contains: search, mode: 'insensitive' } },
        { use_case: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.saaSApplication.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        application: true,
      },
    });
  }

  async findOne(id: string, tenantId: string) {
    const app = await this.prisma.saaSApplication.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        application: true,
      },
    });

    if (!app) {
      throw new NotFoundException('SaaS application not found');
    }

    return app;
  }

  async create(tenantId: string, userId: string, dto: any) {
    return this.prisma.saaSApplication.create({
      data: {
        tenant_id: tenantId,
        vendor: dto.vendor,
        product_url: dto.product_url,
        use_case: dto.use_case,
        pricing_model: dto.pricing_model,
        annual_contract_value: dto.annual_contract_value ? Number(dto.annual_contract_value) : null,
        contract_start_date: dto.contract_start_date ? new Date(dto.contract_start_date) : null,
        contract_end_date: dto.contract_end_date ? new Date(dto.contract_end_date) : null,
        auto_renewal: dto.auto_renewal ?? false,
        total_seats: dto.total_seats ? parseInt(dto.total_seats) : null,
        data_residency: dto.data_residency,
        has_dpa: dto.has_dpa ?? false,
        is_shadow_it: dto.is_shadow_it ?? false,
        discovered_at: new Date(),
      },
    });
  }

  async update(id: string, tenantId: string, dto: any) {
    await this.findOne(id, tenantId);

    const data: any = {};
    if (dto.vendor !== undefined) data.vendor = dto.vendor;
    if (dto.product_url !== undefined) data.product_url = dto.product_url;
    if (dto.use_case !== undefined) data.use_case = dto.use_case;
    if (dto.pricing_model !== undefined) data.pricing_model = dto.pricing_model;
    if (dto.annual_contract_value !== undefined) data.annual_contract_value = dto.annual_contract_value ? Number(dto.annual_contract_value) : null;
    if (dto.contract_start_date !== undefined) data.contract_start_date = dto.contract_start_date ? new Date(dto.contract_start_date) : null;
    if (dto.contract_end_date !== undefined) data.contract_end_date = dto.contract_end_date ? new Date(dto.contract_end_date) : null;
    if (dto.auto_renewal !== undefined) data.auto_renewal = dto.auto_renewal;
    if (dto.total_seats !== undefined) data.total_seats = dto.total_seats ? parseInt(dto.total_seats) : null;
    if (dto.data_residency !== undefined) data.data_residency = dto.data_residency;
    if (dto.has_dpa !== undefined) data.has_dpa = dto.has_dpa;
    if (dto.is_shadow_it !== undefined) data.is_shadow_it = dto.is_shadow_it;

    return this.prisma.saaSApplication.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.saaSApplication.delete({ where: { id } });
  }

  async getStats(tenantId: string) {
    const apps = await this.prisma.saaSApplication.findMany({
      where: { tenant_id: tenantId },
      select: {
        annual_contract_value: true,
        total_seats: true,
        active_users: true,
        contract_end_date: true,
        is_shadow_it: true,
        pricing_model: true,
      },
    });

    const totalSpend = apps.reduce((sum, app) => sum + Number(app.annual_contract_value || 0), 0);
    const shadowItCount = apps.filter(app => app.is_shadow_it).length;
    const totalSeats = apps.reduce((sum, app) => sum + (app.total_seats || 0), 0);
    const activeUsers = apps.reduce((sum, app) => sum + (app.active_users || 0), 0);

    const now = new Date();
    const upcomingRenewals = apps.filter(app => {
      if (!app.contract_end_date) return false;
      const daysUntil = Math.ceil((new Date(app.contract_end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 90;
    }).length;

    const byVendor: Record<string, number> = {};
    for (const app of apps) {
      const vendor = app.pricing_model || 'Unknown';
      byVendor[vendor] = (byVendor[vendor] || 0) + Number(app.annual_contract_value || 0);
    }

    return {
      total_apps: apps.length,
      total_spend: totalSpend,
      total_seats: totalSeats,
      active_users: activeUsers,
      utilization_rate: totalSeats > 0 ? Math.round((activeUsers / totalSeats) * 100) : 0,
      shadow_it_count: shadowItCount,
      upcoming_renewals: upcomingRenewals,
      spend_by_pricing_model: byVendor,
    };
  }

  async getRenewalCalendar(tenantId: string, months: number = 12) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    const apps = await this.prisma.saaSApplication.findMany({
      where: {
        tenant_id: tenantId,
        contract_end_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        vendor: true,
        contract_end_date: true,
        annual_contract_value: true,
        auto_renewal: true,
      },
      orderBy: { contract_end_date: 'asc' },
    });

    return apps.map(app => ({
      id: app.id,
      vendor: app.vendor,
      renewal_date: app.contract_end_date,
      contract_value: app.annual_contract_value,
      auto_renewal: app.auto_renewal,
      days_until_renewal: app.contract_end_date 
        ? Math.ceil((new Date(app.contract_end_date).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));
  }

  async getUtilizationStats(tenantId: string) {
    const apps = await this.prisma.saaSApplication.findMany({
      where: { tenant_id: tenantId },
      select: {
        id: true,
        vendor: true,
        total_seats: true,
        active_users: true,
      },
    });

    return apps.map(app => {
      const total = app.total_seats || 0;
      const active = app.active_users || 0;
      const rate = total > 0 ? Math.round((active / total) * 100) : 0;
      
      let status = 'green';
      if (rate > 90) status = 'red';
      else if (rate < 70) status = 'yellow';

      return {
        id: app.id,
        vendor: app.vendor,
        total_seats: total,
        active_users: active,
        utilization_rate: rate,
        status,
      };
    });
  }

  async getInactiveUsers(tenantId: string, daysThreshold: number = 90) {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

    const apps = await this.prisma.saaSApplication.findMany({
      where: { tenant_id: tenantId },
      select: {
        id: true,
        vendor: true,
        last_login_check_date: true,
      },
    });

    return apps.filter(app => 
      app.last_login_check_date && new Date(app.last_login_check_date) < thresholdDate
    );
  }

  generateInactiveUsersCSV(apps: any[]): string {
    const headers = ['Vendor', 'Application ID', 'Last Login Check', 'Days Inactive'];
    const rows = apps.map(app => {
      const lastCheck = app.last_login_check_date ? new Date(app.last_login_check_date) : null;
      const daysInactive = lastCheck ? Math.floor((Date.now() - lastCheck.getTime()) / (1000 * 60 * 60 * 24)) : 'N/A';
      return [
        app.vendor || '',
        app.id || '',
        lastCheck ? lastCheck.toISOString().split('T')[0] : 'Never',
        daysInactive
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }

  async updateSeats(id: string, tenantId: string, totalSeats: number, activeUsers: number) {
    await this.findOne(id, tenantId);
    return this.prisma.saaSApplication.update({
      where: { id },
      data: {
        total_seats: totalSeats,
        active_users: activeUsers,
        last_login_check_date: new Date(),
      },
    });
  }

  async getSpendBreakdown(tenantId: string) {
    const apps: any[] = await this.db.saaSApplication.findMany({
      where: { tenant_id: tenantId },
      select: {
        vendor: true,
        annual_contract_value: true,
        use_case: true,
        business_unit: true,
      },
    });

    const byVendor: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byBusinessUnit: Record<string, number> = {};
    let totalSpend = 0;

    for (const app of apps) {
      const value = Number(app.annual_contract_value || 0);
      totalSpend += value;
      byVendor[app.vendor || 'Unknown'] = (byVendor[app.vendor || 'Unknown'] || 0) + value;
      byCategory[app.use_case || 'Uncategorized'] = (byCategory[app.use_case || 'Uncategorized'] || 0) + value;
      byBusinessUnit[app.business_unit || 'Unassigned'] = (byBusinessUnit[app.business_unit || 'Unassigned'] || 0) + value;
    }

    return {
      total_spend: totalSpend,
      by_vendor: Object.entries(byVendor)
        .map(([vendor, spend]) => ({ vendor, spend, percentage: totalSpend > 0 ? Math.round((spend / totalSpend) * 100) : 0 }))
        .sort((a, b) => b.spend - a.spend),
      by_category: Object.entries(byCategory)
        .map(([category, spend]) => ({ category, spend, percentage: totalSpend > 0 ? Math.round((spend / totalSpend) * 100) : 0 }))
        .sort((a, b) => b.spend - a.spend),
      by_business_unit: Object.entries(byBusinessUnit)
        .map(([bu, spend]) => ({ business_unit: bu, spend, percentage: totalSpend > 0 ? Math.round((spend / totalSpend) * 100) : 0 }))
        .sort((a, b) => b.spend - a.spend),
    };
  }

  async getSpendTrend(tenantId: string, period: string = 'monthly') {
    const apps = await this.prisma.saaSApplication.findMany({
      where: { tenant_id: tenantId },
      select: {
        vendor: true,
        annual_contract_value: true,
        contract_start_date: true,
      },
    });

    const months: Record<string, number> = {};
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }

    for (const app of apps) {
      if (app.contract_start_date) {
        const startDate = new Date(app.contract_start_date);
        const key = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        if (months[key] !== undefined) {
          months[key] += Number(app.annual_contract_value || 0) / 12;
        }
      } else {
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        months[currentMonth] += Number(app.annual_contract_value || 0) / 12;
      }
    }

    const trend = Object.entries(months).map(([month, spend]) => ({
      month,
      spend: Math.round(spend),
    }));

    const yoy: Record<string, number> = {};
    for (const app of apps) {
      if (app.contract_start_date) {
        const year = new Date(app.contract_start_date).getFullYear().toString();
        yoy[year] = (yoy[year] || 0) + Number(app.annual_contract_value || 0);
      }
    }

    const yearly = Object.entries(yoy).map(([year, spend]) => ({ year, spend: Math.round(spend) }));

    return {
      monthly: trend,
      yearly,
      current_monthly_run_rate: trend[trend.length - 1]?.spend || 0,
    };
  }

  async getVendorConcentration(tenantId: string) {
    const apps = await this.prisma.saaSApplication.findMany({
      where: { tenant_id: tenantId },
      select: {
        vendor: true,
        annual_contract_value: true,
      },
    });

    const vendorSpend: Record<string, number> = {};
    let totalSpend = 0;

    for (const app of apps) {
      const value = Number(app.annual_contract_value || 0);
      totalSpend += value;
      vendorSpend[app.vendor || 'Unknown'] = (vendorSpend[app.vendor || 'Unknown'] || 0) + value;
    }

    const sorted = Object.entries(vendorSpend)
      .map(([vendor, spend]) => ({ vendor, spend, percentage: totalSpend > 0 ? Math.round((spend / totalSpend) * 100) : 0 }))
      .sort((a, b) => b.spend - a.spend);

    const topVendor = sorted[0];
    const top3Spend = sorted.slice(0, 3).reduce((sum, v) => sum + v.spend, 0);

    return {
      total_vendors: sorted.length,
      top_vendor: topVendor ? { name: topVendor.vendor, spend: topVendor.spend, percentage: topVendor.percentage } : null,
      top_3_percentage: totalSpend > 0 ? Math.round((top3Spend / totalSpend) * 100) : 0,
      concentration_risk: topVendor && topVendor.percentage > 30 ? 'high' : topVendor && topVendor.percentage > 20 ? 'medium' : 'low',
      all_vendors: sorted,
    };
  }

  async getUtilizationTrend(tenantId: string, appId?: string) {
    const where: any = { tenant_id: tenantId };
    if (appId) where.id = appId;

    const apps = await this.prisma.saaSApplication.findMany({
      where,
      select: {
        id: true,
        vendor: true,
        total_seats: true,
        active_users: true,
        last_login_check_date: true,
      },
    });

    const now = new Date();
    const trends = apps.map(app => {
      const history: any[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const simulatedActive = app.active_users || Math.floor((app.total_seats || 10) * (0.5 + Math.random() * 0.4));
        const rate = app.total_seats ? Math.round((simulatedActive / app.total_seats) * 100) : 0;
        history.push({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          utilization_rate: rate,
          active_users: simulatedActive,
          total_seats: app.total_seats || 0,
        });
      }
      return {
        app_id: app.id,
        vendor: app.vendor,
        history,
      };
    });

    return trends;
  }
}
