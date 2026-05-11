import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ScheduledTasksService } from './scheduled-tasks.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(private scheduledTasks: ScheduledTasksService) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async handleDailyRenewalChecks() {
    this.logger.log('Running daily renewal alert check...');
    try {
      await this.scheduledTasks.processRenewalAlerts();
    } catch (error) {
      this.logger.error('Error processing renewal alerts:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async handleDailyAnnualReviews() {
    this.logger.log('Running daily annual review check...');
    try {
      await this.scheduledTasks.processAnnualReviews();
    } catch (error) {
      this.logger.error('Error processing annual reviews:', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleDailyEOLAlerts() {
    this.logger.log('Running daily EOL alert check...');
    try {
      await this.scheduledTasks.processEOLAlerts();
      await this.scheduledTasks.processEOLRiskScoreCalculation();
    } catch (error) {
      this.logger.error('Error processing EOL alerts:', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyServiceNowSync() {
    this.logger.log('Running hourly ServiceNow sync check...');
    try {
      await this.scheduledTasks.processServiceNowSync();
    } catch (error) {
      this.logger.error('Error processing ServiceNow sync:', error);
    }
  }
}