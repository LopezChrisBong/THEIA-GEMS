import { PartialType } from '@nestjs/mapped-types';
import { CreateSaleAdditionalPaymentDto } from './create-sale-additional-payment.dto';

export class UpdateSaleAdditionalPaymentDto extends PartialType(CreateSaleAdditionalPaymentDto) {}
