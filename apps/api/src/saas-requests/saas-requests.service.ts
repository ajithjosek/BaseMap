import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SaaSRequestsService {
  private db: any;

  constructor(private prisma: PrismaService) {
    this.db = this.db as any;
  }

  private readonly WORKFLOW_STEPS = [
    { step: 1, name: 'IT Review', approver_role: 'IT_ADMIN' },
    { step: 2, name: 'Security Review', approver_role: 'SECURITY' },
    { step: 3, name: 'Finance Approval', approver_role: 'FINANCE' },
  ];

  async create(tenantId: string, userId: string, dto: any) {
    const request = await this.db.saaSRequest.create({
      data: {
        tenant_id: tenantId,
        requester_id: userId,
        tool_name: dto.tool_name,
        vendor: dto.vendor,
        use_case: dto.use_case,
        estimated_cost: dto.estimated_cost ? Number(dto.estimated_cost) : null,
        justification: dto.justification,
        current_state: 'pending',
        current_step: 1,
      },
    });

    for (const step of this.WORKFLOW_STEPS) {
      await this.db.saaSRequestStep.create({
        data: {
          request_id: request.id,
          step_number: step.step,
          step_name: step.name,
          status: step.step === 1 ? 'pending' : 'waiting',
        },
      });
    }

    await this.createNotification(tenantId, userId, request.id, 'Request Created', `Your SaaS request for ${dto.tool_name} has been submitted.`);

    return request;
  }

  async findAll(tenantId: string, userId: string, filters?: { state?: string; role?: string }) {
    const where: any = { tenant_id: tenantId };

    if (filters?.state) {
      where.current_state = filters.state;
    }

    if (filters?.role === 'approver') {
      where.steps = {
        some: {
          status: 'pending',
          approver_id: userId,
        },
      };
    }

    return this.db.saaSRequest.findMany({
      where,
      include: {
        requester: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        approver: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        steps: {
          orderBy: { step_number: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const request = await this.db.saaSRequest.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        requester: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        approver: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        steps: {
          orderBy: { step_number: 'asc' },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('SaaS request not found');
    }

    return request;
  }

  async approve(id: string, tenantId: string, userId: string, dto: { comment?: string }) {
    const request = await this.findOne(id, tenantId);
    
    if (request.current_state !== 'pending') {
      throw new BadRequestException('Request is not in pending state');
    }

    const currentStep = request.steps.find(s => s.step_number === request.current_step);
    if (!currentStep) {
      throw new BadRequestException('No current step found');
    }

    await this.db.saaSRequestStep.update({
      where: { id: currentStep.id },
      data: {
        status: 'approved',
        approver_id: userId,
        approver_name: 'Current User',
        comments: dto.comment,
        action_at: new Date(),
      },
    });

    if (request.current_step < this.WORKFLOW_STEPS.length) {
      await this.db.saaSRequest.update({
        where: { id },
        data: {
          current_step: request.current_step + 1,
        },
      });

      await this.db.saaSRequestStep.updateMany({
        where: { request_id: id, step_number: request.current_step + 1 },
        data: { status: 'pending' },
      });

      await this.createNotification(tenantId, request.requester_id, id, 'Request Progressed', `Your request for ${request.tool_name} has moved to the next approval step.`);
    } else {
      await this.db.saaSRequest.update({
        where: { id },
        data: {
          current_state: 'approved',
          approved_by: userId,
          approved_at: new Date(),
          approver_comments: dto.comment,
        },
      });

      await this.db.saaSApplication.create({
        data: {
          tenant_id: tenantId,
          vendor: request.vendor,
          tool_name: request.tool_name,
          use_case: request.use_case,
          annual_contract_value: request.estimated_cost,
          approved_by: userId,
          approval_date: new Date(),
          is_shadow_it: false,
          discovered_at: new Date(),
        },
      });

      await this.createNotification(tenantId, request.requester_id, id, 'Request Approved', `Your SaaS request for ${request.tool_name} has been approved!`);
    }

    return this.findOne(id, tenantId);
  }

  async reject(id: string, tenantId: string, userId: string, dto: { comment: string }) {
    if (!dto.comment) {
      throw new BadRequestException('Rejection comment is required');
    }

    const request = await this.findOne(id, tenantId);
    
    if (request.current_state !== 'pending') {
      throw new BadRequestException('Request is not in pending state');
    }

    const currentStep = request.steps.find(s => s.step_number === request.current_step);
    
    await this.db.saaSRequestStep.update({
      where: { id: currentStep?.id },
      data: {
        status: 'rejected',
        approver_id: userId,
        approver_name: 'Current User',
        comments: dto.comment,
        action_at: new Date(),
      },
    });

    await this.db.saaSRequest.update({
      where: { id },
      data: {
        current_state: 'rejected',
        approver_comments: dto.comment,
      },
    });

    await this.createNotification(tenantId, request.requester_id, id, 'Request Rejected', `Your SaaS request for ${request.tool_name} has been rejected. Reason: ${dto.comment}`);

    return this.findOne(id, tenantId);
  }

  async requestChanges(id: string, tenantId: string, userId: string, dto: { comment: string }) {
    if (!dto.comment) {
      throw new BadRequestException('Change request comment is required');
    }

    const request = await this.findOne(id, tenantId);
    
    if (request.current_state !== 'pending') {
      throw new BadRequestException('Request is not in pending state');
    }

    const currentStep = request.steps.find(s => s.step_number === request.current_step);
    
    await this.db.saaSRequestStep.update({
      where: { id: currentStep?.id },
      data: {
        status: 'changes_requested',
        approver_id: userId,
        approver_name: 'Current User',
        comments: dto.comment,
        action_at: new Date(),
      },
    });

    await this.db.saaSRequest.update({
      where: { id },
      data: {
        current_state: 'changes_requested',
        approver_comments: dto.comment,
      },
    });

    await this.createNotification(tenantId, request.requester_id, id, 'Changes Requested', `Please address the following feedback for your request: ${dto.comment}`);

    return this.findOne(id, tenantId);
  }

  async getPendingApprovals(tenantId: string, userId: string) {
    const requests = await this.db.saaSRequest.findMany({
      where: {
        tenant_id: tenantId,
        current_state: 'pending',
        steps: {
          some: {
            status: 'pending',
            approver_id: userId,
          },
        },
      },
      include: {
        requester: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        steps: {
          where: { status: 'pending', approver_id: userId },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return requests;
  }

  private async createNotification(tenantId: string, userId: string, entityId: string, title: string, message: string) {
    await this.db.notification.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        type: 'saas_request',
        title,
        message,
        related_entity_type: 'saas_request',
        related_entity_id: entityId,
      },
    });
  }
}