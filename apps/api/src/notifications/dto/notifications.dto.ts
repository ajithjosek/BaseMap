import { IsString, IsOptional, IsBoolean, IsNumber, Min, IsObject } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class SendLifecycleChangeDto {
  @IsString()
  applicationName: string;

  @IsString()
  oldState: string;

  @IsString()
  newState: string;
}

export class SendEOLAlertDto {
  @IsString()
  applicationName: string;

  @IsString()
  eolDate: string;

  @IsNumber()
  daysRemaining: number;
}

export class NotificationsQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
