import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCostDto, UpdateCostDto } from './dto/create-cost.dto';

@Injectable()
export class CostsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCostDto, userId: string) {
    return this.prisma.applicationCost.create({
      data: {
        ...dto,
        tenant_id: tenantId,
        created_by: userId,
      },
    });
  }

  async findAllByApplication(applicationId: string) {
    return this.prisma.applicationCost.findMany({
      where: { application_id: applicationId },
      orderBy: { effective_date: 'desc' },
    });
  }

  async getTCO(applicationId: string) {
    const costs = await this.prisma.applicationCost.findMany({
      where: { application_id: applicationId },
    });

    // Simple annual TCO calculation logic
    // In a real app, this would handle different billing cycles and currency conversion
    const total = costs.reduce((sum, cost) => sum + Number(cost.amount), 0);

    return {
      total_annual_cost: total,
      currency: costs[0]?.currency || 'USD',
      cost_count: costs.length,
    };
  }

  async remove(id: string) {
    return this.prisma.applicationCost.delete({
      where: { id },
    });
  }
}
