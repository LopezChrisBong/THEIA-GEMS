import { PartialType } from '@nestjs/swagger';
import { CreateInstallmentPaymentDto } from './create-installment-payment.dto';

export class UpdateInstallmentPaymentDto extends PartialType(CreateInstallmentPaymentDto) {}
