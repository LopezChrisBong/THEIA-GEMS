import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JewelryItemsService } from './jewelry-items.service';
import { JewelryItemsController } from './jewelry-items.controller';
import { JewelryItem } from './entities/jewelry-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JewelryItem])],
  controllers: [JewelryItemsController],
  providers: [JewelryItemsService],
  exports: [JewelryItemsService],
})
export class JewelryItemsModule {}
