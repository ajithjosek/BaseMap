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
import { WorkflowsService } from './workflows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('workflows')
@UseGuards(JwtAuthGuard, AdminGuard)
export class WorkflowsController {
  constructor(private readonly workflows: WorkflowsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: any, @CurrentUser() user: any) {
    return this.workflows.create((req as any).tenantId, dto, user);
  }

  @Get()
  list(@Req() req: any) {
    return this.workflows.list((req as any).tenantId);
  }

  @Get('runs')
  runs(@Req() req: any, @Query('workflow_id') workflowId?: string) {
    return this.workflows.listRuns((req as any).tenantId, workflowId);
  }

  @Get(':id')
  one(@Req() req: any, @Param('id') id: string) {
    return this.workflows.get((req as any).tenantId, id);
  }

  @Post(':id/run')
  run(@Req() req: any, @Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.workflows.start((req as any).tenantId, id, dto, user);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.workflows.update((req as any).tenantId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.workflows.remove((req as any).tenantId, id);
  }
}