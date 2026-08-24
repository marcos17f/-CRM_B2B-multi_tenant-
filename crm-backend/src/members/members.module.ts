import { Module } from '@nestjs/common';
import { PlansModule } from '../plans/plans.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [PlansModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
