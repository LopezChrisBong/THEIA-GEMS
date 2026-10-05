import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstallmentPaymentsService } from './installment-payments.service';
import { InstallmentPaymentsController } from './installment-payments.controller';
import { InstallmentPayment } from './entities/installment-payment.entity';
import { InstallmentPlansModule } from '../installment-plans/installment-plans.module';
import { SalesModule } from '../sales/sales.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InstallmentPayment]),
    InstallmentPlansModule,
    SalesModule,
  ],
  controllers: [InstallmentPaymentsController],
  providers: [InstallmentPaymentsService],
  exports: [InstallmentPaymentsService],
})
export class InstallmentPaymentsModule {}
