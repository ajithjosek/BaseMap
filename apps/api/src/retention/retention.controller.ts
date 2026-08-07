import {
  Controller,
  Get,
  Put,
  Post,
  UseGuards,
  Body,
} from '@nestjs/common';
import { RetentionService } from './retention.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin/retention-settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class RetentionController {
  constructor(private readonly retention: RetentionService) {}

  @Get()
  get() {
    return this.retention.getSettings();
  }

  @Put()
  update(@Body() dto: any) {
    return this.retention.updateSettings(dto);
  }

  @Post('purge')
  purge() {
    return this.retention.purgeExpired();
  }
}