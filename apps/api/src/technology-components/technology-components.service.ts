import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TechnologyComponentsService {
  private db: any;

  constructor(private prisma: PrismaService) {
    this.db = this.prisma as any;
  }

  async findAll(tenantId: string, filters?: { type?: string; environment?: string }) {
    const where: any = { tenant_id: tenantId };
    if (filters?.type) where.component_type = filters.type;
    if (filters?.environment) where.environment = filters.environment;

    return this.db.technologyComponent.findMany({
      where,
      include: {
        applications: {
          include: {
            application: { select: { id: true, name: true } },
          },
        },
        dependencies_to: {
          include: {
            from_component: { select: { id: true, name: true, component_type: true } },
          },
        },
        dependencies_from: {
          include: {
            to_component: { select: { id: true, name: true, component_type: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const component = await this.db.technologyComponent.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        applications: {
          include: {
            application: { select: { id: true, name: true } },
          },
        },
        dependencies_to: {
          include: {
            from_component: { select: { id: true, name: true, component_type: true } },
          },
        },
        dependencies_from: {
          include: {
            to_component: { select: { id: true, name: true, component_type: true } },
          },
        },
      },
    });

    if (!component) {
      throw new NotFoundException('Technology component not found');
    }

    return component;
  }

  async create(tenantId: string, userId: string, dto: any) {
    return this.db.technologyComponent.create({
      data: {
        tenant_id: tenantId,
        name: dto.name,
        component_type: dto.component_type,
        environment: dto.environment || 'Production',
        status: dto.status || 'Active',
        host: dto.host,
        ip_address: dto.ip_address,
        cloud_region: dto.cloud_region,
        resource_specs: dto.resource_specs || {},
        software_details: dto.software_details || {},
        eol_date: dto.eol_date ? new Date(dto.eol_date) : null,
        data_classification: dto.data_classification,
        retention_policy: dto.retention_policy,
        row_count_estimate: dto.row_count_estimate ? BigInt(dto.row_count_estimate) : null,
        storage_size_gb: dto.storage_size_gb ? Number(dto.storage_size_gb) : null,
        custom_attributes: dto.custom_attributes || {},
      },
    });
  }

  async update(id: string, tenantId: string, dto: any) {
    await this.findOne(id, tenantId);

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.component_type !== undefined) data.component_type = dto.component_type;
    if (dto.environment !== undefined) data.environment = dto.environment;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.host !== undefined) data.host = dto.host;
    if (dto.ip_address !== undefined) data.ip_address = dto.ip_address;
    if (dto.cloud_region !== undefined) data.cloud_region = dto.cloud_region;
    if (dto.resource_specs !== undefined) data.resource_specs = dto.resource_specs;
    if (dto.software_details !== undefined) data.software_details = dto.software_details;
    if (dto.eol_date !== undefined) data.eol_date = dto.eol_date ? new Date(dto.eol_date) : null;
    if (dto.data_classification !== undefined) data.data_classification = dto.data_classification;
    if (dto.retention_policy !== undefined) data.retention_policy = dto.retention_policy;
    if (dto.storage_size_gb !== undefined) data.storage_size_gb = dto.storage_size_gb ? Number(dto.storage_size_gb) : null;
    if (dto.custom_attributes !== undefined) data.custom_attributes = dto.custom_attributes;

    return this.db.technologyComponent.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.db.technologyComponent.delete({ where: { id } });
  }

  async linkToApplication(componentId: string, tenantId: string, applicationId: string) {
    await this.findOne(componentId, tenantId);

    const existing = await this.db.applicationComponent.findFirst({
      where: { application_id: applicationId, component_id: componentId },
    });

    if (existing) return existing;

    return this.db.applicationComponent.create({
      data: { application_id: applicationId, component_id: componentId },
    });
  }

  async unlinkFromApplication(componentId: string, applicationId: string) {
    return this.db.applicationComponent.deleteMany({
      where: { application_id: applicationId, component_id: componentId },
    });
  }

  async addDependency(tenantId: string, fromComponentId: string, toComponentId: string, type?: string, description?: string) {
    await this.findOne(fromComponentId, tenantId);
    await this.findOne(toComponentId, tenantId);

    return this.db.componentDependency.create({
      data: {
        tenant_id: tenantId,
        from_component_id: fromComponentId,
        to_component_id: toComponentId,
        dependency_type: type || 'runtime',
        description,
      },
    });
  }

  async removeDependency(dependencyId: string, tenantId: string) {
    return this.db.componentDependency.deleteMany({
      where: { id: dependencyId, tenant_id: tenantId },
    });
  }

  async getCloudReadiness(tenantId: string, applicationId: string) {
    const app = await this.db.application.findFirst({
      where: { id: applicationId, tenant_id: tenantId },
      include: {
        application_components: {
          include: {
            component: true,
          },
        },
      },
    });

    if (!app) {
      throw new NotFoundException('Application not found');
    }

    const components = app.application_components.map(ac => ac.component);
    
    const scores = {
      portability: this.calculatePortabilityScore(components),
      dependencyComplexity: this.calculateDependencyScore(components),
      dataResidency: this.calculateDataResidencyScore(components),
      security: this.calculateSecurityScore(components, app.data_classification),
      containerization: this.calculateContainerizationScore(components),
    };

    const totalScore = Math.round(
      (scores.portability * 0.2) +
      (scores.dependencyComplexity * 0.25) +
      (scores.dataResidency * 0.15) +
      (scores.security * 0.25) +
      (scores.containerization * 0.15)
    );

    let complexity = 'Low';
    if (totalScore < 40) complexity = 'High';
    else if (totalScore < 70) complexity = 'Medium';

    await this.db.application.update({
      where: { id: applicationId },
      data: { 
        cloud_readiness_score: totalScore,
        migration_complexity: complexity,
      },
    });

    return {
      total_score: totalScore,
      migration_complexity: complexity,
      breakdown: scores,
    };
  }

  private calculatePortabilityScore(components: any[]): number {
    const cloudComponents = components.filter(c => 
      c.component_type === 'Cloud Service' || c.cloud_region
    ).length;
    const onPremComponents = components.filter(c => 
      c.component_type === 'Server' || c.component_type === 'Database'
    ).length;

    if (components.length === 0) return 50;
    return Math.round((cloudComponents / (cloudComponents + onPremComponents || 1)) * 100);
  }

  private calculateDependencyScore(components: any[]): number {
    const hasDependencies = components.some(c => 
      c.dependencies_from?.length > 0 || c.dependencies_to?.length > 0
    );
    return hasDependencies ? 60 : 90;
  }

  private calculateDataResidencyScore(components: any[]): number {
    const hasRegion = components.some(c => c.cloud_region);
    return hasRegion ? 80 : 50;
  }

  private calculateSecurityScore(components: any[], dataClassification: string): number {
    let baseScore = 70;
    if (dataClassification === 'Confidential') baseScore -= 20;
    if (dataClassification === 'Restricted') baseScore -= 30;
    return baseScore;
  }

  private calculateContainerizationScore(components: any[]): number {
    const customAttrs = components.filter(c => 
      c.custom_attributes?.containerized || c.custom_attributes?.kubernetes
    ).length;
    if (components.length === 0) return 50;
    return Math.round((customAttrs / components.length) * 100);
  }
}