import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { PaymentMethod, PaymentType } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsOptional()
  @IsString()
  paymentNumber?: string;

  @IsNotEmpty()
  @IsNumber()
  saleId: number;

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
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

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
