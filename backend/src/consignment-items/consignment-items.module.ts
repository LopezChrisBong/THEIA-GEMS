import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsignmentItemsService } from './consignment-items.service';
import { ConsignmentItemsController } from './consignment-items.controller';
import { ConsignmentItem } from './entities/consignment-item.entity';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [TypeOrmModule.forFeature([ConsignmentItem]), MailModule, SmsModule],
  controllers: [ConsignmentItemsController],
  providers: [ConsignmentItemsService],
  exports: [ConsignmentItemsService],
})
export class ConsignmentItemsModule {}
