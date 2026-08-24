import { Module } from '@nestjs/common';
import { ReportsModule } from '../reports/reports.module';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';

@Module({
  imports: [ReportsModule],
  controllers: [SegmentsController],
  providers: [SegmentsService],
})
export class SegmentsModule {}
