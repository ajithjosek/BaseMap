import { Controller, Post, Body, Param, Get, UseGuards, Query, BadRequestException, NotFoundException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportExportService } from './import-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PreviewImportDto, CreateExportDto } from './dto/import-export.dto';

@Controller('import-export')
@UseGuards(JwtAuthGuard)
export class ImportExportController {
  constructor(
    private readonly importExportService: ImportExportService,
  ) {}

  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewImport(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: PreviewImportDto,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    let data: any[] = [];
    if (dto.fileType === 'csv') {
      data = await this.importExportService.parseCSV(file.buffer);
    } else if (dto.fileType === 'xlsx' || dto.fileType === 'xls') {
      data = await this.importExportService.parseExcel(file.buffer);
    } else {
      throw new BadRequestException('Invalid file type. Supported: csv, xlsx, xls');
    }

    return this.importExportService.createImportJob(
      user.tenantId,
      user.userId,
      file.originalname,
      dto.fileType,
      data,
      dto.modelType,
      dto.columnMapping,
    );
  }

  @Post('import/:id/process')
  async processImport(@Param('id') id: string, @CurrentUser() user: any) {
    return this.importExportService.processImportJob(id, user.tenantId, user.userId);
  }

  @Post('export')
  async createExport(
    @Body() dto: CreateExportDto,
    @CurrentUser() user: any,
  ) {
    return this.importExportService.createExportJob(
      user.tenantId,
      user.userId,
      dto.exportType,
      dto.format,
      dto.filters,
      dto.columns,
    );
  }

  @Post('export/:id/process')
  async processExport(@Param('id') id: string, @CurrentUser() user: any) {
    return this.importExportService.processExportJob(id, user.tenantId);
  }

  @Get('export/:id/download')
  async downloadExport(@Param('id') id: string, @CurrentUser() user: any) {
    const exportJob = await this.importExportService.getExportFile(id, user.tenantId);
    return { message: 'Export job completed', exportJob };
  }

  @Get('import-jobs')
  async getImportJobs(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.importExportService.getImportJobs(
      user.tenantId,
      status,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Get('export-jobs')
  async getExportJobs(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.importExportService.getExportJobs(
      user.tenantId,
      status,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }
}
