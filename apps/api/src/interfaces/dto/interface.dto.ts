import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, IsBoolean } from 'class-validator';

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
  @IsNumber()
  latency_target_ms?: number;

  @IsOptional()
  @IsNumber()
  throughput_target?: number;

  @IsOptional()
  @IsNumber()
  availability_target?: number;

  @IsOptional()
  @IsNumber()
  records_per_day?: number;

  @IsOptional()
  @IsNumber()
  avg_message_size_kb?: number;

  @IsOptional()
  @IsBoolean()
  processes_pii?: boolean;

  @IsOptional()
  @IsString()
  data_classification?: string;

  @IsOptional()
  @IsUUID()
  owner_id?: string;
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
  authentication_type?: string;

  @IsOptional()
  @IsString()
  endpoint_url?: string;

  @IsOptional()
  @IsNumber()
  latency_target_ms?: number;

  @IsOptional()
  @IsNumber()
  throughput_target?: number;

  @IsOptional()
  @IsNumber()
  availability_target?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  owner_id?: string;
}

export class CreateIncidentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  incident_type?: string;

  @IsOptional()
  @IsEnum(['Low', 'Medium', 'High', 'Critical'])
  severity?: string;
}