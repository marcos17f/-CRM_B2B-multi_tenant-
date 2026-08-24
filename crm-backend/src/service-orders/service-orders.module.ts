import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ServiceOrdersController } from './service-orders.controller';
import { ServiceOrdersService } from './service-orders.service';

@Module({
  imports: [ActivitiesModule, InventoryModule],
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService],
})
export class ServiceOrdersModule {}
