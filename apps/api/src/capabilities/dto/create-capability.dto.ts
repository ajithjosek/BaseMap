import { IsString, IsOptional, IsInt, IsEnum, IsUUID, Min } from 'class-validator';

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

export class UpdateCapabilityDto extends CreateCapabilityDto {}

export class MapApplicationDto {
  @IsUUID()
  application_id: string;

  @IsEnum(['Primary', 'Supporting', 'Legacy'])
  support_level: string;
}
