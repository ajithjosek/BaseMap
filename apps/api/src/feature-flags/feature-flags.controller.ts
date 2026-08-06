import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('feature-flags')
@UseGuards(JwtAuthGuard)
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  async list(@CurrentUser() user: any) {
    return this.featureFlagsService.getFlags(user.tenantId);
  }

  @Put()
  @UseGuards(AdminGuard)
  async update(
    @Body() body: { flags?: Record<string, boolean> },
    @CurrentUser() user: any,
  ) {
    const flags = body.flags || {};
    return this.featureFlagsService.setFlags(user.tenantId, flags);
  }
}
