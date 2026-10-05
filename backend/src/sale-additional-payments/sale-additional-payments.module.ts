import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleAdditionalPaymentsService } from './sale-additional-payments.service';
import { SaleAdditionalPaymentsController } from './sale-additional-payments.controller';
import { SaleAdditionalPayment } from './entities/sale-additional-payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SaleAdditionalPayment])],
  controllers: [SaleAdditionalPaymentsController],
  providers: [SaleAdditionalPaymentsService],
  exports: [SaleAdditionalPaymentsService],
})
export class SaleAdditionalPaymentsModule {}
