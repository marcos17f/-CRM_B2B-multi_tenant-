import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PlansModule } from '../plans/plans.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { OpportunityLineItemsController } from './opportunity-line-items.controller';
import { OpportunityLineItemsService } from './opportunity-line-items.service';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';

@Module({
  imports: [ActivitiesModule, WorkflowsModule, PlansModule, InventoryModule],
  controllers: [OpportunitiesController, OpportunityLineItemsController],
  providers: [OpportunitiesService, OpportunityLineItemsService],
})
export class OpportunitiesModule {}
