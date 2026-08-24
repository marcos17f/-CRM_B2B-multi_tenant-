import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
