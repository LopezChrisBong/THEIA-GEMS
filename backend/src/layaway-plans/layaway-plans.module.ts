import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayawayPlansService } from './layaway-plans.service';
import { LayawayPlansController } from './layaway-plans.controller';
import { LayawayPlan } from './entities/layaway-plan.entity';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [TypeOrmModule.forFeature([LayawayPlan]), MailModule, SmsModule],
  controllers: [LayawayPlansController],
  providers: [LayawayPlansService],
  exports: [LayawayPlansService],
})
export class LayawayPlansModule {}
