import { Module } from '@nestjs/common';
import { EquipmentModule } from '../equipment/equipment.module';
import { PlansModule } from '../plans/plans.module';
import { ReportsModule } from '../reports/reports.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [ReportsModule, PlansModule, EquipmentModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
