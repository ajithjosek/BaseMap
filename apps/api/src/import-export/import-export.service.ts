import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';

@Injectable()
export class ImportExportService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async parseCSV(fileBuffer: Buffer, options?: { header: boolean }) {
    return new Promise<any[]>((resolve, reject) => {
      Papa.parse(fileBuffer.toString(), {
        header: options?.header ?? true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data as any[]),
        error: (error) => reject(error),
      });
    });
  }

  async parseExcel(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    return jsonData as any[];
  }

  async validateImportData(data: any[], modelType: string): Promise<{ valid: boolean; errors: any[]; preview: any[] }> {
    const errors: any[] = [];
    const preview: any[] = [];

    switch (modelType) {
      case 'application':
        for (let i = 0; i < Math.min(data.length, 5); i++) {
          const row = data[i];
          const rowErrors: any[] = [];

          if (!row.name) rowErrors.push({ field: 'name', message: 'Name is required' });
          if (!row.lifecycle_state || !['Planning', 'Active', 'Maintenance', 'Retirement', 'Retired'].includes(row.lifecycle_state)) {
            rowErrors.push({ field: 'lifecycle_state', message: 'Invalid lifecycle state' });
          }

          if (rowErrors.length > 0) {
            errors.push({ row: i + 2, errors: rowErrors });
          } else {
            preview.push({
              name: row.name,
              vendor: row.vendor || '',
              lifecycle_state: row.lifecycle_state,
            });
          }
        }
        break;

      case 'cost':
        for (let i = 0; i < Math.min(data.length, 5); i++) {
          const row = data[i];
          const rowErrors: any[] = [];

          if (!row.application_id && !row.application_name) {
            rowErrors.push({ field: 'application', message: 'Application ID or name is required' });
          }
          if (!row.cost_type) rowErrors.push({ field: 'cost_type', message: 'Cost type is required' });
          if (!row.amount || isNaN(Number(row.amount)) || Number(row.amount) < 0) {
            rowErrors.push({ field: 'amount', message: 'Valid amount is required' });
          }

          if (rowErrors.length > 0) {
            errors.push({ row: i + 2, errors: rowErrors });
          } else {
            preview.push({
              application: row.application_name || row.application_id,
              cost_type: row.cost_type,
              amount: Number(row.amount),
            });
          }
        }
        break;

      default:
        preview.push(...data.slice(0, 5));
    }

    return {
      valid: errors.length === 0,
      errors,
      preview,
    };
  }

  async createImportJob(
    tenantId: string,
    userId: string,
    fileName: string,
    fileType: string,
    data: any[],
    modelType: string,
    columnMapping?: Record<string, string>,
  ) {
    const validation = await this.validateImportData(data, modelType);

    const importJob = await this.prisma.importJob.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        file_name: fileName,
        file_type: fileType,
        status: validation.valid ? 'validating' : 'validation_failed',
        total_rows: data.length,
        errors: validation.errors,
        column_mapping: columnMapping || {},
        preview_data: validation.preview,
        started_at: validation.valid ? new Date() : undefined,
      },
    });

    return importJob;
  }

  async processImportJob(importJobId: string, tenantId: string, userId: string) {
    const importJob = await this.prisma.importJob.findUnique({
      where: { id: importJobId },
    });

    if (!importJob) {
      throw new NotFoundException('Import job not found');
    }

    if (importJob.tenant_id !== tenantId) {
      throw new NotFoundException('Import job not found');
    }

    if (importJob.status !== 'validating') {
      throw new BadRequestException('Import job is not in validating state');
    }

    await this.prisma.importJob.update({
      where: { id: importJobId },
      data: { status: 'processing', started_at: new Date() },
    });

    let successRows = 0;
    let failedRows = 0;
    const processingErrors: any[] = [];

    try {
      const rawData = importJob.preview_data as any[];

      for (let i = 0; i < rawData.length; i++) {
        try {
          const row = rawData[i];

          const existingApp = await this.prisma.application.findFirst({
            where: {
              tenant_id: tenantId,
              name: row.name,
              deleted_at: null,
            },
          });

          if (existingApp) {
            await this.prisma.application.update({
              where: { id: existingApp.id },
              data: {
                vendor: row.vendor || existingApp.vendor,
                lifecycle_state: row.lifecycle_state || existingApp.lifecycle_state,
                updated_at: new Date(),
                updated_by: userId,
              },
            });
          } else {
            await this.prisma.application.create({
              data: {
                tenant_id: tenantId,
                name: row.name,
                vendor: row.vendor || '',
                lifecycle_state: row.lifecycle_state || 'Planning',
                created_by: userId,
                updated_by: userId,
              },
            });
          }

          successRows++;
        } catch (error) {
          failedRows++;
          processingErrors.push({
            row: i + 2,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const allErrors = [...(importJob.errors as any[] || []), ...processingErrors];

      await this.prisma.importJob.update({
        where: { id: importJobId },
        data: {
          status: failedRows > 0 ? 'completed_with_errors' : 'completed',
          success_rows: successRows,
          failed_rows: failedRows,
          errors: allErrors,
          completed_at: new Date(),
        },
      });

      await this.notificationsService.sendImportCompletionNotification(
        tenantId,
        userId,
        importJob.file_name,
        importJob.total_rows || 0,
        successRows,
        failedRows,
      );

      return {
        success: true,
        importJobId,
        successRows,
        failedRows,
      };
    } catch (error) {
      await this.prisma.importJob.update({
        where: { id: importJobId },
        data: {
          status: 'failed',
          errors: [...(importJob.errors as any[] || []), { error: error instanceof Error ? error.message : 'Unknown error' }],
          completed_at: new Date(),
        },
      });

      throw error;
    }
  }

  async createExportJob(
    tenantId: string,
    userId: string,
    exportType: string,
    format: string,
    filters?: Record<string, any>,
    columns?: string[],
  ) {
    const exportJob = await this.prisma.exportJob.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        export_type: exportType,
        format,
        status: 'pending',
        filters: filters || {},
        columns: columns || [],
      },
    });

    return exportJob;
  }

  async processExportJob(exportJobId: string, tenantId: string) {
    const exportJob = await this.prisma.exportJob.findUnique({
      where: { id: exportJobId },
    });

    if (!exportJob) {
      throw new NotFoundException('Export job not found');
    }

    if (exportJob.tenant_id !== tenantId) {
      throw new NotFoundException('Export job not found');
    }

    await this.prisma.exportJob.update({
      where: { id: exportJobId },
      data: { status: 'processing', started_at: new Date() },
    });

    try {
      let data: any[] = [];

      switch (exportJob.export_type) {
        case 'applications':
          const whereClause: any = { deleted_at: null, tenant_id: tenantId };
          const filters = exportJob.filters as Record<string, any> | null;
          if (filters?.lifecycle) {
            whereClause.lifecycle_state = filters.lifecycle;
          }
          if (filters?.search) {
            whereClause.OR = [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ];
          }

          const apps = await this.prisma.application.findMany({
            where: whereClause,
            include: {
              business_unit: true,
              owner: true,
            },
          });

          data = apps.map((app) => ({
            id: app.id,
            name: app.name,
            description: app.description,
            vendor: app.vendor,
            version: app.version,
            technology_type: app.technology_type,
            lifecycle_state: app.lifecycle_state,
            risk_score: app.risk_score,
            eol_date: app.eol_date,
            business_unit: app.business_unit?.name || '',
            owner: app.owner ? `${app.owner.first_name} ${app.owner.last_name}` : '',
            created_at: app.created_at,
            updated_at: app.updated_at,
          }));
          break;

        case 'costs':
          const costs = await this.prisma.applicationCost.findMany({
            where: { tenant_id: tenantId },
            include: {
              application: true,
            },
          });

          data = costs.map((cost) => ({
            id: cost.id,
            application_name: cost.application.name,
            cost_type: cost.cost_type,
            amount: cost.amount,
            currency: cost.currency,
            billing_cycle: cost.billing_cycle,
            effective_date: cost.effective_date,
            end_date: cost.end_date,
            notes: cost.notes,
          }));
          break;

        default:
          throw new BadRequestException(`Unknown export type: ${exportJob.export_type}`);
      }

      let fileBuffer: Buffer;
      let fileExtension: string;

      if (exportJob.format === 'csv') {
        const csvContent = await this.generateCSV(data);
        fileBuffer = Buffer.from(csvContent);
        fileExtension = 'csv';
      } else if (exportJob.format === 'xlsx' || exportJob.format === 'excel') {
        fileBuffer = await this.generateExcel(data);
        fileExtension = 'xlsx';
      } else if (exportJob.format === 'json') {
        fileBuffer = Buffer.from(JSON.stringify(data, null, 2));
        fileExtension = 'json';
      } else {
        throw new BadRequestException(`Unsupported format: ${exportJob.format}`);
      }

      const fileName = `export_${exportJob.export_type}_${Date.now()}.${fileExtension}`;

      await this.prisma.exportJob.update({
        where: { id: exportJobId },
        data: {
          status: 'completed',
          file_size: fileBuffer.length,
          file_url: fileName,
          completed_at: new Date(),
        },
      });

      await this.notificationsService.sendExportCompletionNotification(
        tenantId,
        exportJob.user_id,
        exportJob.export_type,
        exportJob.format,
        fileName,
      );

      return {
        success: true,
        exportJobId,
        fileUrl: fileName,
        fileSize: fileBuffer.length,
        rowCount: data.length,
      };
    } catch (error) {
      await this.prisma.exportJob.update({
        where: { id: exportJobId },
        data: {
          status: 'failed',
          completed_at: new Date(),
        },
      });

      throw error;
    }
  }

  async getExportFile(exportJobId: string, tenantId: string) {
    const exportJob = await this.prisma.exportJob.findUnique({
      where: { id: exportJobId },
    });

    if (!exportJob) {
      throw new NotFoundException('Export job not found');
    }

    if (exportJob.tenant_id !== tenantId) {
      throw new NotFoundException('Export job not found');
    }

    if (exportJob.status !== 'completed' || !exportJob.file_url) {
      throw new BadRequestException('Export file is not ready');
    }

    return exportJob;
  }

  async generateCSV(data: any[]): Promise<string> {
    return Papa.unparse(data);
  }

  async generateExcel(data: any[]): Promise<Buffer> {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  async getImportJobs(tenantId: string, status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.importJob.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.importJob.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getExportJobs(tenantId: string, status?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: any = { tenant_id: tenantId };
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.exportJob.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.exportJob.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
