import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';
import { ConsignmentStatus } from '../entities/consignment-item.entity';

export class CreateConsignmentItemDto {
  @IsNotEmpty()
  @IsNumber()
  jewelryItemId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  consignorName: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  consignorContact?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  consignedPrice: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionRate?: number;

  @IsNotEmpty()
  @IsDateString()
  consignmentDate: string;

  @IsOptional()
  @IsEnum(ConsignmentStatus)
  status?: ConsignmentStatus;

  @IsNotEmpty()
  @IsNumber()
  branchId: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
