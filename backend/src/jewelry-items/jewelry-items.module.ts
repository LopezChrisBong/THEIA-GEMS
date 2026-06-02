import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JewelryItemsService } from './jewelry-items.service';
import { JewelryItemsController } from './jewelry-items.controller';
import { JewelryItem } from './entities/jewelry-item.entity';
import { UserDetail } from 'src/entities';
import { TransactionLogsModule } from '../transaction-logs/transaction-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([JewelryItem, UserDetail]), TransactionLogsModule],
  controllers: [JewelryItemsController],
  providers: [JewelryItemsService],
  exports: [JewelryItemsService],
})
export class JewelryItemsModule {}
