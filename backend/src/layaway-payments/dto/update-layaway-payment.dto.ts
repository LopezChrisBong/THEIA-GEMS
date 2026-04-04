import { PartialType } from '@nestjs/swagger';
import { CreateLayawayPaymentDto } from './create-layaway-payment.dto';

export class UpdateLayawayPaymentDto extends PartialType(CreateLayawayPaymentDto) {}
