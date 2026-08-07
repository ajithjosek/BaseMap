import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { evaluateCondition } from './condition-evaluator';

const STEP_TYPES = ['start', 'approval', 'condition', 'parallel', 'notification', 'task', 'end'];

interface TraceEntry {
  step_id: string;
  name?: string;
  step_type: string;
  status: 'passed' | 'skipped' | 'failed';
  decided?: boolean;
  approvals?: { role: string; outcome: string }[];
}

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);
  private readonly db: any;

  constructor(private readonly prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  private requireTenant(tenantId?: string) {
    if (!tenantId) throw new BadRequestException('Tenant context required');
    return tenantId;
  }

  // ------------------------- CRUD -------------------------

  async create(tenantId: string | undefined, dto: any, actor: any) {
    const tenant = this.requireTenant(tenantId);
    if (!dto?.name || !dto?.entity_type) {
      throw new BadRequestException('name and entity_type are required');
    }
    const workflow = await this.db.workflow.create({
      data: {
        tenant_id: tenant,
        name: dto.name,
        description: dto.description,
        entity_type: dto.entity_type,
        is_active: dto.is_active !== false,
        created_by: actor?.userId,
      },
    });
    if (Array.isArray(dto.steps) && dto.steps.length) {
      await this.db.workflowStep.createMany({
        data: dto.steps.map((s: any, i: number) => this.stepRow(workflow.id, s, i)),
      });
    }
    return { workflow: await this.get(tenantId, workflow.id) };
  }

  private stepRow(workflowId: string, s: any, index: number) {
    if (!STEP_TYPES.includes(s.step_type)) {
      throw new BadRequestException(`Invalid step_type '${s.step_type}'`);
    }
    return {
      workflow_id: workflowId,
      step_type: s.step_type,
      name: s.name,
      config: s.config && typeof s.config === 'object' ? s.config : {},
      position_x: Number(s.position_x ?? 0),
      position_y: Number(s.position_y ?? 0),
      sort_order: Number(s.sort_order ?? index),
    };
  }

  async list(tenantId: string | undefined) {
    const tenant = this.requireTenant(tenantId);
    const workflows = await this.db.workflow.findMany({
      where: { tenant_id: tenant },
      orderBy: { created_at: 'desc' },
      include: { steps: { orderBy: { sort_order: 'asc' } } },
    });
    return { workflows };
  }

  async get(tenantId: string | undefined, id: string) {
    const tenant = this.requireTenant(tenantId);
    const workflow = await this.db.workflow.findFirst({
      where: { id, tenant_id: tenant },
      include: { steps: { orderBy: { sort_order: 'asc' } } },
    });
    if (!workflow) throw new NotFoundException('Workflow not found');
    return workflow;
  }

  async update(tenantId: string | undefined, id: string, dto: any) {
    const tenant = this.requireTenant(tenantId);
    const existing = await this.db.workflow.findFirst({ where: { id, tenant_id: tenant } });
    if (!existing) throw new NotFoundException('Workflow not found');

    await this.db.workflow.update({
      where: { id },
      data: {
        name: dto.name ?? existing.name,
        description: dto.description ?? existing.description,
        entity_type: dto.entity_type ?? existing.entity_type,
        is_active: dto.is_active ?? existing.is_active,
      },
    });

    if (dto.steps) {
      if (!Array.isArray(dto.steps)) throw new BadRequestException('steps must be an array');
      await this.db.workflowStep.deleteMany({ where: { workflow_id: id } });
      if (dto.steps.length) {
        await this.db.workflowStep.createMany({
          data: dto.steps.map((s: any, i: number) => this.stepRow(id, s, i)),
        });
      }
    }
    return { workflow: await this.get(tenantId, id) };
  }

  async remove(tenantId: string | undefined, id: string) {
    const tenant = this.requireTenant(tenantId);
    const existing = await this.db.workflow.findFirst({ where: { id, tenant_id: tenant } });
    if (!existing) throw new NotFoundException('Workflow not found');
    await this.db.workflowStep.deleteMany({ where: { workflow_id: id } });
    await this.db.workflow.delete({ where: { id } });
    return { deleted: true };
  }

  // ------------------------- Execution (37.3 / 37.4) -------------------------

  async start(tenantId: string | undefined, workflowId: string, dto: any, actor: any) {
    const tenant = this.requireTenant(tenantId);
    const workflow = await this.db.workflow.findFirst({
      where: { id: workflowId, tenant_id: tenant },
      include: { steps: { orderBy: { sort_order: 'asc' } } },
    });
    if (!workflow) throw new NotFoundException('Workflow not found');

    const context: any = { ...(dto?.context ?? {}) };
    const instance = await this.db.workflowInstance.create({
      data: {
        workflow_id: workflow.id,
        entity_type: workflow.entity_type,
        entity_id: dto?.entity_id ?? '00000000-0000-0000-0000-000000000000',
        status: 'running',
        context,
        created_by: actor?.userId,
        trace: [],
      },
    });

    const steps: any[] = workflow.steps;
    if (!steps.length) {
      await this.db.workflowInstance.update({
        where: { id: instance.id },
        data: { status: 'completed', completed_at: new Date(), trace: [] },
      });
      return this.one(instance.id);
    }

    const trace: TraceEntry[] = [];
    for (const step of steps) {
      const entry = this.runStep(step, context);
      trace.push(entry);
      if (step.step_type === 'condition' && !entry.decided) continue;
      if (step.step_type === 'end') break;
    }

    await this.db.workflowInstance.update({
      where: { id: instance.id },
      data: { status: 'completed', completed_at: new Date(), trace },
    });
    return this.one(instance.id);
  }

  /** Process a single step and produce its trace entry. */
  private runStep(step: any, ctx: any): TraceEntry {
    const base: TraceEntry = {
      step_id: step.id,
      name: step.name,
      step_type: step.step_type,
      status: 'passed',
    };

    if (step.step_type === 'condition') {
      const expr: string = step.config?.condition;
      const decided = evaluateCondition(expr, ctx);
      return { ...base, status: 'passed', decided };
    }

    if (step.step_type === 'parallel') {
      const mode: 'all' | 'any' = step.config?.mode === 'any' ? 'any' : 'all';
      const branches: any[] = Array.isArray(step.config?.branches)
        ? step.config.branches
        : [];
      const approvals = branches.map((b: any) => {
        const outcome = this.evaluateBranch(b, ctx) ? 'approved' : 'rejected';
        return { role: b.role ?? 'approver', outcome };
      });
      const allPass = approvals.every((a) => a.outcome === 'approved');
      const anyPass = approvals.some((a) => a.outcome === 'approved');
      const passed = mode === 'all' ? allPass : anyPass;
      return { ...base, status: passed ? 'passed' : 'failed', approvals };
    }

    if (step.step_type === 'approval') {
      return { ...base, approvals: [{ role: step.config?.approver_role ?? 'approver', outcome: 'pending' }] };
    }

    return base;
  }

  /** 37.4 Branch decision: condition expression or default. */
  private evaluateBranch(branch: any, ctx: any): boolean {
    if (branch?.condition) return evaluateCondition(branch.condition, ctx);
    return branch?.default !== false;
  }

  async one(id: string) {
    return this.db.workflowInstance.findUnique({ where: { id } });
  }

  async listRuns(tenantId: string | undefined, workflowId?: string) {
    const tenant = this.requireTenant(tenantId);
    const scoped = workflowId
      ? await this.db.workflow.findFirst({ where: { id: workflowId, tenant_id: tenant } })
      : true;
    if (workflowId && !scoped) throw new NotFoundException('Workflow not found');
    const instances = await this.db.workflowInstance.findMany({
      where: workflowId ? { workflow_id: workflowId } : {},
      orderBy: { started_at: 'desc' },
      take: 100,
    });
    return { instances };
  }
}