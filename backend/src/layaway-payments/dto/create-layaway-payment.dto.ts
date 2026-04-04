import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../../payments/entities/payment.entity';

export class CreateLayawayPaymentDto {
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @IsNotEmpty()
  @IsNumber()
  layawayPlanId: number;

  @IsNotEmpty()
  @IsNumber()
  receivedBy: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
