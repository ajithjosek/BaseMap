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
import { TechStandardsService } from './tech-standards.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tech-standards')
@UseGuards(JwtAuthGuard, AdminGuard)
export class TechStandardsController {
  constructor(private readonly standards: TechStandardsService) {}

  // ---- compliance (registered before :id) ----
  @Get('compliance/overview')
  overview(@Req() req: any) {
    return this.standards.complianceOverview((req as any).tenantId);
  }

  @Get('compliance/components')
  components(@Req() req: any) {
    return this.standards.listComponentFlags((req as any).tenantId);
  }

  @Get('compliance/applications/:id')
  app(@Req() req: any, @Param('id') id: string) {
    return this.standards.scoreApplication((req as any).tenantId, id);
  }

  // ---- categories ----
  @Get('categories')
  categories(@Req() req: any) {
    return this.standards.listCategories((req as any).tenantId);
  }

  @Post('categories')
  createCategory(@Req() req: any, @Body() dto: any) {
    return this.standards.createCategory((req as any).tenantId, dto);
  }

  @Put('categories/:id')
  updateCategory(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.standards.updateCategory((req as any).tenantId, id, dto);
  }

  @Delete('categories/:id')
  removeCategory(@Req() req: any, @Param('id') id: string) {
    return this.standards.removeCategory((req as any).tenantId, id);
  }

  // ---- standards CRUD ----
  @Post()
  create(@Req() req: any, @Body() dto: any, @CurrentUser() user: any) {
    return this.standards.create((req as any).tenantId, dto, user);
  }

  @Get()
  list(@Req() req: any, @Query('status') status?: string, @Query('category') category?: string) {
    return this.standards.list((req as any).tenantId, status, category);
  }

  @Post(':id/transition')
  transition(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.standards.transition((req as any).tenantId, id, dto);
  }

  @Get(':id')
  one(@Req() req: any, @Param('id') id: string) {
    return this.standards.get((req as any).tenantId, id);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.standards.update((req as any).tenantId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.standards.remove((req as any).tenantId, id);
  }
}