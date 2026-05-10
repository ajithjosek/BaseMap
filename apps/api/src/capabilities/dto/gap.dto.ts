import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export class CreateGapDto {
  @IsUUID()
  capability_id: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  impact?: string;

  @IsOptional()
  @IsString()
  proposed_solution?: string;

  @IsOptional()
  @IsEnum(['Low', 'Medium', 'High', 'Critical'])
  severity?: string;
}

export class UpdateGapDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  impact?: string;

  @IsOptional()
  @IsString()
  proposed_solution?: string;

  @IsOptional()
  @IsEnum(['Low', 'Medium', 'High', 'Critical'])
  severity?: string;

  @IsOptional()
  @IsEnum(['Open', 'In Progress', 'Closed'])
  status?: string;

  @IsOptional()
  @IsUUID()
  project_id?: string;
}