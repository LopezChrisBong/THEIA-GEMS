import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';
import {
  ReminderType,
  ReminderStatus,
  ReminderChannel,
} from '../entities/payment-reminder.entity';

export class CreatePaymentReminderDto {
  @IsNotEmpty()
  @IsNumber()
  layawayPlanId: number;

  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @IsOptional()
  @IsEnum(ReminderType)
  reminderType?: ReminderType;

  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;

  @IsOptional()
  @IsEnum(ReminderChannel)
  channel?: ReminderChannel;

  @IsNotEmpty()
  @IsDateString()
  scheduledDate: string;

  @IsOptional()
  @IsDateString()
  sentDate?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsNumber()
  sentBy?: number;

  @IsNotEmpty()
  @IsDateString()
  paymentDueDate: string;

  @IsNotEmpty()
  @IsNumber()
  amountDue: number;

  @IsOptional()
  @IsNumber()
  daysBeforeDue?: number;

  @IsOptional()
  @IsNumber()
  daysOverdue?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
