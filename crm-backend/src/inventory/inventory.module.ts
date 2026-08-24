import { Module } from '@nestjs/common';
import { InventoryMovementsService } from './inventory-movements.service';

@Module({
  providers: [InventoryMovementsService],
  exports: [InventoryMovementsService],
})
export class InventoryModule {}
