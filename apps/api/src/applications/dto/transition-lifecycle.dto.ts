import { IsString, IsEnum, IsOptional, IsDateString, IsUUID } from 'class-validator';

export class TransitionLifecycleDto {
  @IsEnum(['Planning', 'Active', 'Maintenance', 'Retirement', 'Retired'])
  target_state: string;

  @IsString()
  reason: string;

  @IsOptional()
  @IsDateString()
  effective_date?: string;

  @IsOptional()
  @IsUUID()
  approver_id?: string;
}
