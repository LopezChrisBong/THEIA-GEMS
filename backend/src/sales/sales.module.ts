import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale } from './entities/sale.entity';
import { UserDetail } from 'src/entities';
import { TransactionLogsModule } from '../transaction-logs/transaction-logs.module';
import { SaleItem } from '../sale-items/entities/sale-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, UserDetail, SaleItem]), TransactionLogsModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
