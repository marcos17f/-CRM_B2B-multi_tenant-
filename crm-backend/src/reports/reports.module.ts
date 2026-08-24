import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { RfmService } from './rfm.service';
import { SeasonalityService } from './seasonality.service';

@Module({
  controllers: [ReportsController],
  providers: [RfmService, SeasonalityService],
  exports: [RfmService],
})
export class ReportsModule {}
