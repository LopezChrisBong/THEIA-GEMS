import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignModelsService } from './design-models.service';
import { DesignModelsController } from './design-models.controller';
import { DesignModel } from './entities/design-model.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DesignModel])],
  controllers: [DesignModelsController],
  providers: [DesignModelsService],
  exports: [DesignModelsService],
})
export class DesignModelsModule {}
