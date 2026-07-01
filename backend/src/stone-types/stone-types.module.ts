import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoneTypesService } from './stone-types.service';
import { StoneTypesController } from './stone-types.controller';
import { StoneType } from './entities/stone-type.entity';
import { JewelryItem } from '../jewelry-items/entities/jewelry-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StoneType, JewelryItem])],
  controllers: [StoneTypesController],
  providers: [StoneTypesService],
  exports: [StoneTypesService],
})
export class StoneTypesModule {}
