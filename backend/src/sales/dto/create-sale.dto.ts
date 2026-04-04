import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentStatus, SaleType } from '../entities/sale.entity';

export class CreateSaleDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  saleNumber: string;

  @IsNotEmpty()
  @IsNumber()
  branchId: number;

  @IsOptional()
  @IsNumber()
  customerId?: number;

  @IsNotEmpty()
  @IsNumber()
  cashierId: number;

  @IsOptional()
  @IsDateString()
  saleDate?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  changeAmount?: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsEnum(SaleType)
  saleType?: SaleType;

  @IsOptional()
  @IsString()
  notes?: string;
}
