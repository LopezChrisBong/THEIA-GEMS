import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JewelryItemImagesService } from './jewelry-item-images.service';
import { JewelryItemImagesController } from './jewelry-item-images.controller';
import { JewelryItemImage } from './entities/jewelry-item-image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JewelryItemImage])],
  controllers: [JewelryItemImagesController],
  providers: [JewelryItemImagesService],
  exports: [JewelryItemImagesService],
})
export class JewelryItemImagesModule {}
