import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsBoolean } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  technology_type?: string;

  @IsOptional()
  @IsString()
  business_unit_id?: string;

  @IsOptional()
  @IsEnum(['Planning', 'Active', 'Maintenance', 'Retirement', 'Retired'])
  lifecycle_state?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  risk_score?: number;

  @IsOptional()
  @IsString()
  deployment_model?: string;

  @IsOptional()
  @IsBoolean()
  is_approved?: boolean;
}

export class UpdateApplicationDto extends CreateApplicationDto {}
