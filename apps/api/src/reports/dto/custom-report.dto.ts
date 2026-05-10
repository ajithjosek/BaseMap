import { IsString, IsOptional, IsArray, IsBoolean, IsEnum, IsNumber } from 'class-validator';

export class CreateCustomReportDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  entity_type: string;

  @IsOptional()
  @IsArray()
  columns?: string[];

  @IsOptional()
  @IsArray()
  filters?: any[];

  @IsOptional()
  @IsArray()
  group_by?: string[];

  @IsOptional()
  @IsArray()
  aggregations?: any[];

  @IsOptional()
  @IsBoolean()
  is_shared?: boolean;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  schedule?: string;

  @IsOptional()
  @IsString()
  schedule_time?: string;
}

export class UpdateCustomReportDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  columns?: string[];

  @IsOptional()
  @IsArray()
  filters?: any[];

  @IsOptional()
  @IsArray()
  group_by?: string[];

  @IsOptional()
  @IsArray()
  aggregations?: any[];

  @IsOptional()
  @IsBoolean()
  is_shared?: boolean;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  schedule?: string;

  @IsOptional()
  @IsString()
  schedule_time?: string;
}

export class ExecuteReportDto {
  @IsOptional()
  @IsArray()
  filters?: any[];

  @IsOptional()
  @IsArray()
  group_by?: string[];

  @IsOptional()
  @IsArray()
  aggregations?: any[];

  @IsOptional()
  @IsString()
  format?: string;
}