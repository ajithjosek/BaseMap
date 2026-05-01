import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotificationsGateway } from './notifications.gateway';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  private transporter: any;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    @Inject(forwardRef(() => NotificationsGateway))
    private gateway: NotificationsGateway,
  ) {
    const smtpHost = this.configService.get('SMTP_HOST');
    const smtpPort = this.configService.get('SMTP_PORT');
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');

    if (smtpHost && smtpPort && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
  }

  async createNotification(
    tenantId: string,
    userId: string,
    type: string,
    title: string,
    message: string,
    relatedEntityType?: string,
    relatedEntityId?: string,
    metadata?: Record<string, any>,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        type,
        title,
        message,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId,
        metadata: metadata || {},
      },
    });

    this.gateway.sendNotificationToUser(userId, notification);

    const unreadCount = await this.getUnreadCount(userId, tenantId);
    this.gateway.sendUnreadCountUpdate(userId, unreadCount);

    return notification;
  }

  async getNotifications(tenantId: string, userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { tenant_id: tenantId, user_id: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { tenant_id: tenantId, user_id: userId } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(notificationId: string, userId: string, tenantId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.user_id !== userId || notification.tenant_id !== tenantId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true, read_at: new Date() },
    });
  }

  async markAllAsRead(userId: string, tenantId: string) {
    return this.prisma.notification.updateMany({
      where: { tenant_id: tenantId, user_id: userId, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });
  }

  async deleteNotification(notificationId: string, userId: string, tenantId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.user_id !== userId || notification.tenant_id !== tenantId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  async getUnreadCount(userId: string, tenantId: string) {
    return this.prisma.notification.count({
      where: { tenant_id: tenantId, user_id: userId, is_read: false },
    });
  }

  async sendLifecycleChangeNotification(
    tenantId: string,
    userId: string,
    applicationName: string,
    oldState: string,
    newState: string,
  ) {
    const notification = await this.createNotification(
      tenantId,
      userId,
      'lifecycle_change',
      `Lifecycle Changed: ${applicationName}`,
      `Application "${applicationName}" changed from "${oldState}" to "${newState}"`,
      'application',
    );

    await this.sendEmailNotification(userId, `Lifecycle Changed: ${applicationName}`, 
      `Application "${applicationName}" changed from "${oldState}" to "${newState}"`);

    return notification;
  }

  async sendEOLAlertNotification(
    tenantId: string,
    userId: string,
    applicationName: string,
    eolDate: Date,
    daysRemaining: number,
  ) {
    const notification = await this.createNotification(
      tenantId,
      userId,
      'eol_alert',
      `EOL Alert: ${applicationName}`,
      `Application "${applicationName}" will reach end of life in ${daysRemaining} days (${eolDate.toISOString().split('T')[0]})`,
      'application',
    );

    await this.sendEmailNotification(userId, `EOL Alert: ${applicationName}`,
      `Application "${applicationName}" will reach end of life in ${daysRemaining} days (${eolDate.toISOString().split('T')[0]})`);

    return notification;
  }

  async sendImportCompletionNotification(
    tenantId: string,
    userId: string,
    fileName: string,
    totalRows: number,
    successRows: number,
    failedRows: number,
  ) {
    const notification = await this.createNotification(
      tenantId,
      userId,
      'import_completion',
      `Import Completed: ${fileName}`,
      `Imported ${successRows} of ${totalRows} rows successfully. ${failedRows} rows failed.`,
      'import_job',
    );

    await this.sendEmailNotification(userId, `Import Completed: ${fileName}`,
      `Imported ${successRows} of ${totalRows} rows successfully. ${failedRows} rows failed.`);

    return notification;
  }

  async sendExportCompletionNotification(
    tenantId: string,
    userId: string,
    exportType: string,
    format: string,
    fileUrl: string,
  ) {
    const notification = await this.createNotification(
      tenantId,
      userId,
      'export_completion',
      `Export Completed: ${exportType}`,
      `Your ${exportType} export in ${format} format is ready for download.`,
      'export_job',
    );

    await this.sendEmailNotification(userId, `Export Completed: ${exportType}`,
      `Your ${exportType} export in ${format} format is ready for download.`);

    return notification;
  }

  async scheduleEOLAlerts() {
    const now = new Date();
    const daysToCheck = [90, 60, 30];
    let totalAlerts = 0;

    for (const days of daysToCheck) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + days);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      const apps = await this.prisma.application.findMany({
        where: {
          eol_date: {
            gte: new Date(targetDateStr),
            lt: new Date(new Date(targetDateStr).getTime() + 86400000),
          },
          deleted_at: null,
        },
      });

      for (const app of apps) {
        if (app.owner_id) {
          await this.sendEOLAlertNotification(
            app.tenant_id,
            app.owner_id,
            app.name,
            new Date(targetDateStr),
            days,
          );
          totalAlerts++;
        }
      }
    }

    return { scheduled: totalAlerts };
  }

  private async sendEmailNotification(userId: string, subject: string, body: string) {
    if (!this.transporter) {
      return { sent: false, reason: 'SMTP not configured' };
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user?.email) {
        return { sent: false, reason: 'User email not found' };
      }

      await this.transporter.sendMail({
        from: this.configService.get('SMTP_USER'),
        to: user.email,
        subject: `[BaseMap] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${subject}</h2>
            <p style="color: #666;">${body}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">This is an automated notification from BaseMap.</p>
          </div>
        `,
      });

      await this.prisma.emailLog.create({
        data: {
          tenant_id: user.tenant_id,
          to_email: user.email,
          subject,
          template: 'notification',
          status: 'sent',
        },
      });

      return { sent: true };
    } catch (error) {
      await this.prisma.emailLog.create({
        data: {
          tenant_id: '',
          to_email: '',
          subject,
          template: 'notification',
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      return { sent: false, reason: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
