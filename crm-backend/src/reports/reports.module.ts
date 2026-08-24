import { Module } from '@nestjs/common';
import { MessagingMetricsService } from './messaging-metrics.service';
import { ReportsController } from './reports.controller';
import { RfmService } from './rfm.service';
import { SeasonalityService } from './seasonality.service';

@Module({
  controllers: [ReportsController],
  providers: [RfmService, SeasonalityService, MessagingMetricsService],
  exports: [RfmService],
})
export class ReportsModule {}
