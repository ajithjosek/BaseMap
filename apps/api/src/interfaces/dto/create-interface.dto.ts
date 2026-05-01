import { IsString, IsOptional, IsBoolean, IsNumber, IsUUID } from 'class-validator';

export class CreateInterfaceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  interface_type: string;

  @IsOptional()
  @IsUUID()
  source_application_id?: string;

  @IsOptional()
  @IsUUID()
  target_application_id?: string;

  @IsOptional()
  @IsString()
  direction?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  protocol?: string;

  @IsOptional()
  @IsString()
  data_format?: string;

  @IsOptional()
  @IsString()
  authentication_type?: string;

  @IsOptional()
  @IsString()
  endpoint_url?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  processes_pii?: boolean;
}

export class UpdateInterfaceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  interface_type?: string;

  @IsOptional()
  @IsUUID()
  source_application_id?: string;

  @IsOptional()
  @IsUUID()
  target_application_id?: string;

  @IsOptional()
  @IsString()
  direction?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  protocol?: string;

  @IsOptional()
  @IsString()
  data_format?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
