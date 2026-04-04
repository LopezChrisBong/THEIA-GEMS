import { PartialType } from '@nestjs/swagger';
import { CreatePaymentReminderDto } from './create-payment-reminder.dto';

export class UpdatePaymentReminderDto extends PartialType(
  CreatePaymentReminderDto,
) {}
