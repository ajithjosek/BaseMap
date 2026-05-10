import { IsString, IsDecimal, IsOptional, IsEnum, IsInt, IsDateString, IsUUID } from 'class-validator';

export class CreateCostDto {
  @IsUUID()
  application_id: string;

  @IsString()
  cost_type: string; // e.g., 'Subscription', 'License', 'Maintenance'

  @IsDecimal()
  amount: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  billing_cycle?: string;

  @IsOptional()
  @IsInt()
  total_seats?: number;

  @IsOptional()
  @IsInt()
  used_seats?: number;

  @IsDateString()
  effective_date: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCostDto extends CreateCostDto {}
