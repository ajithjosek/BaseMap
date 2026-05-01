import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, BadRequestException, Req } from '@nestjs/common';
import { InterfacesService } from './interfaces.service';
import { CreateInterfaceDto, UpdateInterfaceDto } from './dto/create-interface.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('interfaces')
@UseGuards(JwtAuthGuard)
export class InterfacesController {
  constructor(private readonly interfacesService: InterfacesService) {}

  @Post()
  async create(@Body() createInterfaceDto: CreateInterfaceDto, @CurrentUser() user: any) {
    return this.interfacesService.create(createInterfaceDto, user.userId);
  }

  @Get()
  findAll(@Query() query: any, @Req() req: any) {
    return this.interfacesService.findAll(query, req.tenantId);
  }

  @Get('graph/:applicationId')
  getDependencyGraph(@Param('applicationId') applicationId: string, @Query('hops') hops: string = '2') {
    return this.interfacesService.getDependencyGraph(applicationId, Number(hops));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.interfacesService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateInterfaceDto: UpdateInterfaceDto, @CurrentUser() user: any) {
    return this.interfacesService.update(id, updateInterfaceDto, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.interfacesService.remove(id);
  }
}
