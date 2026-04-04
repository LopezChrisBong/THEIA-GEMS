import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { LayawayStatus } from '../entities/layaway-plan.entity';

export class CreateLayawayPlanDto {
  @IsOptional()
  @IsString()
  planNumber?: string;

  @IsNotEmpty()
  @IsNumber()
  saleId: number;

  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @IsNotEmpty()
  @IsNumber()
  branchId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  downPayment: number;

  @IsOptional()
  @IsNumber()
  remainingBalance?: number;

  @IsOptional()
  @IsNumber()
  monthlyPayment?: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  numberOfPayments: number;

  @IsOptional()
  @IsNumber()
  paymentsMade?: number;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  nextPaymentDate?: string;

  @IsOptional()
  @IsEnum(LayawayStatus)
  status?: LayawayStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
