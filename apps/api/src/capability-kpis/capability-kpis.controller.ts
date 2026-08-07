import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { CapabilityKpisService } from './capability-kpis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('capabilities/kpis')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CapabilityKpisController {
  constructor(private readonly kpis: CapabilityKpisService) {}

  @Get()
  list(@Req() req: any, @Query('capability_id') capabilityId?: string) {
    return this.kpis.list((req as any).tenantId, capabilityId);
  }

  @Get(':id/values')
  values(@Req() req: any, @Param('id') id: string, @Query('limit') limit?: string) {
    return this.kpis.values((req as any).tenantId, id, limit ? Number(limit) : 30);
  }

  @Get(':id/trend')
  trend(@Req() req: any, @Param('id') id: string) {
    return this.kpis.trend((req as any).tenantId, id);
  }

  @Post(':id/values')
  recordValue(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.kpis.recordValue((req as any).tenantId, id, dto);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.kpis.update((req as any).tenantId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.kpis.remove((req as any).tenantId, id);
  }
}

@Controller('capabilities/:capabilityId/kpis')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CapabilityScopedKpisController {
  constructor(private readonly kpis: CapabilityKpisService) {}

  @Get()
  list(@Req() req: any, @Param('capabilityId') capabilityId: string) {
    return this.kpis.list((req as any).tenantId, capabilityId);
  }

  @Post()
  create(@Req() req: any, @Param('capabilityId') capabilityId: string, @Body() dto: any) {
    return this.kpis.create((req as any).tenantId, capabilityId, dto);
  }
}