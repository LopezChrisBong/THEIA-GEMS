import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JewelryTypesService } from './jewelry-types.service';
import { JewelryTypesController } from './jewelry-types.controller';
import { JewelryType } from './entities/jewelry-type.entity';
import { JewelryItem } from '../jewelry-items/entities/jewelry-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JewelryType, JewelryItem])],
  controllers: [JewelryTypesController],
  providers: [JewelryTypesService],
  exports: [JewelryTypesService],
})
export class JewelryTypesModule {}
