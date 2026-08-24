import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';

@Module({
  imports: [ActivitiesModule, WorkflowsModule],
  controllers: [OpportunitiesController],
  providers: [OpportunitiesService],
})
export class OpportunitiesModule {}
