import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { Transfer } from './entities/transfer.entity';
import { TransferItem } from '../transfer-items/entities/transfer-item.entity';
import { JewelryItem } from '../jewelry-items/entities/jewelry-item.entity';
import { InventoryLog } from '../inventory-logs/entities/inventory-log.entity';
import { UserDetail } from '../user-details/entities/user-detail.entity';
import { TransactionLogsModule } from '../transaction-logs/transaction-logs.module';
import { MailModule } from '../mail/mail.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [TypeOrmModule.forFeature([Transfer, TransferItem, JewelryItem, InventoryLog, UserDetail]), TransactionLogsModule, MailModule, SmsModule],
  controllers: [TransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
