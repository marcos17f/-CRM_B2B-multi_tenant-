import { Module } from '@nestjs/common';
import { PlansModule } from '../plans/plans.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  imports: [PlansModule],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
