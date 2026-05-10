import { IsString, IsOptional, IsInt, IsEnum, IsUUID, Min, IsBoolean } from 'class-validator';

export class CreateCapabilityDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  level: number;

  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @IsOptional()
  @IsUUID()
  owner_id?: string;

  @IsOptional()
  @IsEnum(['Low', 'Medium', 'High', 'Critical'])
  strategic_importance?: string;
}

export class UpdateCapabilityDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(1) level?: number;
  @IsOptional() @IsUUID() parent_id?: string | null;
  @IsOptional() @IsUUID() owner_id?: string | null;
  @IsOptional() @IsEnum(['Low', 'Medium', 'High', 'Critical']) strategic_importance?: string;
  @IsOptional() @IsBoolean() is_locked?: boolean;
}

export class MapApplicationDto {
  @IsUUID()
  application_id: string;

  @IsEnum(['Primary', 'Supporting', 'Enabling'])
  support_level: string;
}
