import { Controller, Get, Post, Delete, Param, UseGuards, Query, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SendLifecycleChangeDto, SendEOLAlertDto } from './dto/notifications.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getNotifications(
      user.tenantId,
      user.userId,
      parseInt(page || '1'),
      parseInt(limit || '20'),
    );
  }

  @Post(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.markAsRead(id, user.userId, user.tenantId);
  }

  @Post('mark-all-read')
  async markAllAsRead(@CurrentUser() user: any) {
    return this.notificationsService.markAllAsRead(user.userId, user.tenantId);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @CurrentUser() user: any) {
    return this.notificationsService.deleteNotification(id, user.userId, user.tenantId);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: any) {
    return { unreadCount: await this.notificationsService.getUnreadCount(user.userId, user.tenantId) };
  }

  @Post('send-lifecycle-change')
  async sendLifecycleChangeNotification(
    @Body() dto: SendLifecycleChangeDto,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.sendLifecycleChangeNotification(
      user.tenantId,
      user.userId,
      dto.applicationName,
      dto.oldState,
      dto.newState,
    );
  }

  @Post('send-eol-alert')
  async sendEOLAlertNotification(
    @Body() dto: SendEOLAlertDto,
    @CurrentUser() user: any,
  ) {
    return this.notificationsService.sendEOLAlertNotification(
      user.tenantId,
      user.userId,
      dto.applicationName,
      new Date(dto.eolDate),
      dto.daysRemaining,
    );
  }

  @Post('schedule-eol-alerts')
  async scheduleEOLAlerts() {
    return this.notificationsService.scheduleEOLAlerts();
  }
}
