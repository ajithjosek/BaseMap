import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(
      user.tenantId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
      search,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOne(id, user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.usersService.create(user.tenantId, dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: any) {
    return this.usersService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.remove(id, user.tenantId);
  }

  @Post(':id/roles')
  assignRole(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: { roleId: string; businessUnitId: string },
  ) {
    return this.usersService.assignRole(id, user.tenantId, dto);
  }

  @Delete(':id/roles')
  removeRole(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: { roleId: string; businessUnitId: string },
  ) {
    return this.usersService.removeRole(id, user.tenantId, dto.roleId, dto.businessUnitId);
  }

  @Get('roles')
  getRoles(@CurrentUser() user: any) {
    return this.usersService.getRoles(user.tenantId);
  }

  @Get('business-units')
  getBusinessUnits(@CurrentUser() user: any) {
    return this.usersService.getBusinessUnits(user.tenantId);
  }

  @Get('me/preferences')
  getPreferences(@CurrentUser() user: any) {
    return this.usersService.getPreferences(user.userId);
  }

  @Patch('me/preferences')
  updatePreferences(@CurrentUser() user: any, @Body() preferences: any) {
    return this.usersService.updatePreferences(user.userId, preferences);
  }
}
