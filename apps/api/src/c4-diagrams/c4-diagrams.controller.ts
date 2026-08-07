import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { C4DiagramsService } from './c4-diagrams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('c4-diagrams')
@UseGuards(JwtAuthGuard, AdminGuard)
export class C4DiagramsController {
  constructor(private readonly c4: C4DiagramsService) {}

  @Post()
  create(@Req() req: any, @Body() dto: any, @CurrentUser() user: any) {
    return this.c4.create((req as any).tenantId, dto, user);
  }

  @Get()
  list(@Req() req: any, @Query('level') level?: string) {
    return this.c4.list((req as any).tenantId, level);
  }

  @Get(':id')
  one(@Req() req: any, @Param('id') id: string) {
    return this.c4.get((req as any).tenantId, id);
  }

  @Put(':id')
  save(@Req() req: any, @Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.c4.save((req as any).tenantId, id, dto, user);
  }

  @Get(':id/versions')
  versions(@Req() req: any, @Param('id') id: string) {
    return this.c4.versions((req as any).tenantId, id);
  }

  @Put(':id/versions/:versionId/restore')
  restore(@Req() req: any, @Param('id') id: string, @Param('versionId') versionId: string) {
    return this.c4.restore((req as any).tenantId, id, versionId);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.c4.remove((req as any).tenantId, id);
  }
}