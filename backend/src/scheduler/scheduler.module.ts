import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerService } from './scheduler.service';
import { LayawayPlansModule } from '../layaway-plans/layaway-plans.module';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [ScheduleModule.forRoot(), LayawayPlansModule, MailModule, SmsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
