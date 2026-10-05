import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstallmentPlansService } from './installment-plans.service';
import { InstallmentPlansController } from './installment-plans.controller';
import { InstallmentPlan } from './entities/installment-plan.entity';
import { SaleItem } from '../sale-items/entities/sale-item.entity';
import { JewelryItem } from '../jewelry-items/entities/jewelry-item.entity';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [TypeOrmModule.forFeature([InstallmentPlan, SaleItem, JewelryItem]), MailModule, SmsModule],
  controllers: [InstallmentPlansController],
  providers: [InstallmentPlansService],
  exports: [InstallmentPlansService],
})
export class InstallmentPlansModule {}
