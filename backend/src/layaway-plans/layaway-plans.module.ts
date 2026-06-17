import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayawayPlansService } from './layaway-plans.service';
import { LayawayPlansController } from './layaway-plans.controller';
import { LayawayPlan } from './entities/layaway-plan.entity';
import { SaleItem } from '../sale-items/entities/sale-item.entity';
import { JewelryItem } from '../jewelry-items/entities/jewelry-item.entity';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [TypeOrmModule.forFeature([LayawayPlan, SaleItem, JewelryItem]), MailModule, SmsModule],
  controllers: [LayawayPlansController],
  providers: [LayawayPlansService],
  exports: [LayawayPlansService],
})
export class LayawayPlansModule {}
