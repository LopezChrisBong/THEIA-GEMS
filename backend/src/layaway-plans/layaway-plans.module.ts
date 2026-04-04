import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayawayPlansService } from './layaway-plans.service';
import { LayawayPlansController } from './layaway-plans.controller';
import { LayawayPlan } from './entities/layaway-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LayawayPlan])],
  controllers: [LayawayPlansController],
  providers: [LayawayPlansService],
  exports: [LayawayPlansService],
})
export class LayawayPlansModule {}
