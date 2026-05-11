import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { AuthModule } from './auth/auth.module';
import { ApplicationsModule } from './applications/applications.module';
import { CostsModule } from './costs/costs.module';
import { CapabilitiesModule } from './capabilities/capabilities.module';
import { InterfacesModule } from './interfaces/interfaces.module';
import { UsersModule } from './users/users.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { ImportExportModule } from './import-export/import-export.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SaaSApplicationsModule } from './saas-applications/saas-applications.module';
import { SaaSRequestsModule } from './saas-requests/saas-requests.module';
import { ServiceNowModule } from './service-now/service-now.module';
import { ScheduledTasksModule } from './scheduled-tasks/scheduled-tasks.module';
import { JobQueueModule } from './job-queue/job-queue.module';
import { ReportsModule } from './reports/reports.module';
import { TechnologyComponentsModule } from './technology-components/technology-components.module';
import { EOLRiskModule } from './eol-risk/eol-risk.module';
import { QueryBuilderModule } from './query-builder/query-builder.module';
import { TransformationProjectsModule } from './transformation-projects/transformation-projects.module';
import { AIRecommendationsModule } from './ai-recommendations/ai-recommendations.module';
import { AdvancedAnalyticsModule } from './advanced-analytics/advanced-analytics.module';
import { ExportsModule } from './exports/exports.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    ApplicationsModule,
    CostsModule,
    CapabilitiesModule,
    InterfacesModule,
    UsersModule,
    DashboardsModule,
    ImportExportModule,
    NotificationsModule,
    SaaSApplicationsModule,
    SaaSRequestsModule,
    ServiceNowModule,
    ScheduledTasksModule,
    JobQueueModule,
    ReportsModule,
    TechnologyComponentsModule,
    EOLRiskModule,
    QueryBuilderModule,
    TransformationProjectsModule,
    AIRecommendationsModule,
    AdvancedAnalyticsModule,
    ExportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
