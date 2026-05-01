import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CostsService } from './costs.service';
import { CreateCostDto } from './dto/create-cost.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('costs')
@UseGuards(JwtAuthGuard)
export class CostsController {
  constructor(private readonly costsService: CostsService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() createCostDto: CreateCostDto) {
    return this.costsService.create(user.tenantId, createCostDto, user.userId);
  }

  @Get('application/:id')
  findAllByApplication(@Param('id') id: string) {
    return this.costsService.findAllByApplication(id);
  }

  @Get('application/:id/tco')
  getTCO(@Param('id') id: string) {
    return this.costsService.getTCO(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.costsService.remove(id);
  }
}
