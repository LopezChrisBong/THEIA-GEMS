import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { LayawayPlansModule } from '../layaway-plans/layaway-plans.module';
import { ConsignmentItemsModule } from '../consignment-items/consignment-items.module';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';
import { SalesModule } from '../sales/sales.module';
import { BranchesModule } from '../branches/branches.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    LayawayPlansModule,
    ConsignmentItemsModule,
    MailModule,
    SmsModule,
    SalesModule,
    BranchesModule,
    PaymentsModule,
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService],
})
export class SchedulerModule {}
