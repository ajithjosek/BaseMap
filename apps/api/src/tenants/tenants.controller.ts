import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantExportService } from './tenants-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly tenantExportService: TenantExportService,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
  async create(
    @Body() createDto: any,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    return this.tenantsService.create({
      ...createDto,
      createdBy: {
        userId: user.userId,
        email: user.email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get(':id/export')
  @UseGuards(AdminGuard)
  export(@Param('id') id: string) {
    return this.tenantExportService.exportTenantData(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  async update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    return this.tenantsService.update(id, {
      ...updateDto,
      logBy: {
        userId: user.userId,
        email: user.email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Req() req: any,
  ) {
    return this.tenantsService.delete(id, {
      userId: user.userId,
      email: user.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  @Post(':id/cancel-deletion')
  @UseGuards(AdminGuard)
  async cancelDeletion(@Param('id') id: string) {
    return this.tenantsService.cancelDeletion(id);
  }
}
