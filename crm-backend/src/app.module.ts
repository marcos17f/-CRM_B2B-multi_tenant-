import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ActivitiesModule } from './activities/activities.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { TenantInterceptor } from './common/tenant/tenant.interceptor';
import { CompaniesModule } from './companies/companies.module';
import { ContactsModule } from './contacts/contacts.module';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { MembersModule } from './members/members.module';
import { OpportunitiesModule } from './opportunities/opportunities.module';
import { PipelinesModule } from './pipelines/pipelines.module';
import { TasksModule } from './tasks/tasks.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { WorkspacesModule } from './workspaces/workspaces.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      useFactory: (config: ConfigService) => ({ secret: config.getOrThrow<string>('JWT_SECRET') }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    AuthModule,
    MembersModule,
    WorkspacesModule,
    CompaniesModule,
    ContactsModule,
    CampaignsModule,
    PipelinesModule,
    OpportunitiesModule,
    TasksModule,
    ActivitiesModule,
    WorkflowsModule,
    AiModule,
  ],
  controllers: [HealthController],
  providers: [
    // Ordem importa: JwtAuthGuard resolve request.user, PermissionsGuard depende dele.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    // Interceptor global: abre a transação+RLS por request autenticada (ver tenant.interceptor.ts).
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
})
export class AppModule {}
