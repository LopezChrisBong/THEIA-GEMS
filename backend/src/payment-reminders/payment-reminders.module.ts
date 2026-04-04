import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRemindersService } from './payment-reminders.service';
import { PaymentRemindersController } from './payment-reminders.controller';
import { PaymentReminder } from './entities/payment-reminder.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentReminder])],
  controllers: [PaymentRemindersController],
  providers: [PaymentRemindersService],
  exports: [PaymentRemindersService],
})
export class PaymentRemindersModule {}
