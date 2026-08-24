import { Module } from '@nestjs/common';
import { ActivitiesModule } from '../activities/activities.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [ActivitiesModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
