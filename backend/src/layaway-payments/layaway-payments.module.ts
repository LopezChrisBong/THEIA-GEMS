import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LayawayPaymentsService } from './layaway-payments.service';
import { LayawayPaymentsController } from './layaway-payments.controller';
import { LayawayPayment } from './entities/layaway-payment.entity';
import { LayawayPlansModule } from '../layaway-plans/layaway-plans.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LayawayPayment]),
    LayawayPlansModule,
    SalesModule,
  ],
  controllers: [LayawayPaymentsController],
  providers: [LayawayPaymentsService],
  exports: [LayawayPaymentsService],
})
export class LayawayPaymentsModule {}
