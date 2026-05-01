import { IsString, IsOptional, IsObject, IsArray, IsEnum, IsNumber } from 'class-validator';

export enum ModelType {
  APPLICATION = 'application',
  COST = 'cost',
}

export enum FileType {
  CSV = 'csv',
  XLSX = 'xlsx',
  XLS = 'xls',
}

export class PreviewImportDto {
  @IsString()
  fileName: string;

  @IsEnum(FileType)
  fileType: string;

  @IsEnum(ModelType)
  modelType: string;

  @IsOptional()
  @IsObject()
  columnMapping?: Record<string, string>;
}

export class ProcessImportDto {
  @IsOptional()
  @IsObject()
  columnMapping?: Record<string, string>;
}

export class CreateExportDto {
  @IsString()
  exportType: string;

  @IsString()
  format: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @IsOptional()
  @IsArray()
  columns?: string[];
}

export class ImportJobQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class ExportJobQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
