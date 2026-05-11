import { Controller, Get, UseGuards } from '@nestjs/common';
import { EOLRiskService } from './eol-risk.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('eol-risk')
@UseGuards(JwtAuthGuard)
export class EOLRiskController {
  constructor(private readonly eolRiskService: EOLRiskService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: any) {
    return this.eolRiskService.getEOLDashboard(user.tenantId);
  }

  @Get('calculate-scores')
  calculateScores(@CurrentUser() user: any) {
    return this.eolRiskService.calculateAndUpdateRiskScores(user.tenantId);
  }
}