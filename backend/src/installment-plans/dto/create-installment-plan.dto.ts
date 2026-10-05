import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { InstallmentStatus } from '../entities/installment-plan.entity';

export class CreateInstallmentPlanDto {
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
  @IsEnum(InstallmentStatus)
  status?: InstallmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
