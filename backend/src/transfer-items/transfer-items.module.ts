import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransferItemsService } from './transfer-items.service';
import { TransferItemsController } from './transfer-items.controller';
import { TransferItem } from './entities/transfer-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransferItem])],
  controllers: [TransferItemsController],
  providers: [TransferItemsService],
  exports: [TransferItemsService],
})
export class TransferItemsModule {}
