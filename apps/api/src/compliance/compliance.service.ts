import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  private db: any;

  async getFrameworks(tenantId: string, type?: string) {
    const where: any = { tenant_id: tenantId };
    if (type) where.framework_type = type;

    return this.db.complianceFramework.findMany({
      where,
      include: {
        controls: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createFramework(tenantId: string, data: {
    name: string;
    framework_type: string;
    description?: string;
  }) {
    return this.db.complianceFramework.create({
      data: {
        tenant_id: tenantId,
        name: data.name,
        framework_type: data.framework_type,
        description: data.description,
        compliance_pct: 0,
        is_active: true,
      },
    });
  }

  async getControls(frameworkId: string) {
    return this.db.complianceControl.findMany({
      where: { framework_id: frameworkId },
      orderBy: { control_id: 'asc' },
    });
  }

  async createControl(frameworkId: string, data: {
    control_id: string;
    name: string;
    description?: string;
    risk_level?: string;
    owner?: string;
  }) {
    return this.db.complianceControl.create({
      data: {
        framework_id: frameworkId,
        control_id: data.control_id,
        name: data.name,
        description: data.description,
        risk_level: data.risk_level || 'low',
        owner: data.owner,
        status: 'non_compliant',
      },
    });
  }

  async updateControl(id: string, data: any) {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.evidence) updateData.evidence = data.evidence;
    if (data.owner) updateData.owner = data.owner;
    if (data.due_date) updateData.due_date = new Date(data.due_date);
    updateData.last_reviewed = new Date();

    return this.db.complianceControl.update({
      where: { id },
      data: updateData,
    });
  }

  async getDashboardSummary(tenantId: string) {
    const frameworks = await this.db.complianceFramework.findMany({
      where: { tenant_id: tenantId, is_active: true },
      include: {
        controls: { select: { status: true, risk_level: true } },
      },
    });

    let totalControls = 0;
    let compliant = 0;
    let nonCompliant = 0;
    let highRisk = 0;
    let mediumRisk = 0;
    let lowRisk = 0;
    let nonCompliantCount = 0;

    for (const fw of frameworks) {
      for (const c of fw.controls) {
        totalControls++;
        if (c.status === 'compliant') compliant++;
        else nonCompliantCount++;
        if (c.risk_level === 'high') highRisk++;
        else if (c.risk_level === 'medium') mediumRisk++;
        else lowRisk++;
      }
    }

    const avgCompliance = totalControls > 0 ? Math.round((compliant / totalControls) * 100) : 0;

    return {
      total_frameworks: frameworks.length,
      total_controls: totalControls,
      compliant,
      non_compliant: nonCompliantCount,
      high_risk: highRisk,
      medium_risk: mediumRisk,
      low_risk: lowRisk,
      compliance_percentage: avgCompliance,
    };
  }

  async getSecurityAssessments(tenantId: string, entityType?: string) {
    const where: any = { tenant_id: tenantId };
    if (entityType) where.entity_type = entityType;

    return this.db.securityAssessment.findMany({
      where,
      orderBy: { assessed_at: 'desc' },
      take: 50,
    });
  }

  async createSecurityAssessment(tenantId: string, data: {
    entity_type: string;
    entity_id: string;
    assessment_type: string;
    score: number;
    max_score?: number;
    findings?: any[];
    vulnerabilities?: any[];
  }) {
    return this.db.securityAssessment.create({
      data: {
        tenant_id: tenantId,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        assessment_type: data.assessment_type,
        score: data.score,
        max_score: data.max_score || 100,
        findings: data.findings || [],
        vulnerabilities: data.vulnerabilities || [],
      },
    });
  }

  async getSecurityScore(tenantId: string) {
    const assessments = await this.db.securityAssessment.findMany({
      where: { tenant_id: tenantId },
      orderBy: { assessed_at: 'desc' },
    });

    const byEntity: Record<string, { score: number; max: number; date: Date }> = {};
    for (const a of assessments) {
      const key = `${a.entity_type}-${a.entity_id}`;
      if (!byEntity[key] || new Date(a.assessed_at) > new Date(byEntity[key].date)) {
        byEntity[key] = { score: a.score, max: a.max_score, date: a.assessed_at };
      }
    }

    const scores = Object.values(byEntity);
    const avgScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, s) => sum + (s.score / s.max * 100), 0) / scores.length)
      : 0;

    return {
      average_score: avgScore,
      assessed_entities: scores.length,
      score_breakdown: {
        critical: scores.filter(s => (s.score / s.max * 100) < 40).length,
        high: scores.filter(s => (s.score / s.max * 100) >= 40 && (s.score / s.max * 100) < 60).length,
        medium: scores.filter(s => (s.score / s.max * 100) >= 60 && (s.score / s.max * 100) < 80).length,
        low: scores.filter(s => (s.score / s.max * 100) >= 80).length,
      },
    };
  }
}