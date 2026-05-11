import { IsString, IsOptional, IsDateString, IsNumber, IsEnum } from 'class-validator';

export class CreateTransformationProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsString()
  dependencies?: string;

  @IsOptional()
  @IsString()
  risks?: string;

  @IsOptional()
  milestones?: any[];
}

export class UpdateTransformationProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsString()
  dependencies?: string;

  @IsOptional()
  @IsString()
  risks?: string;

  @IsOptional()
  milestones?: any[];
}