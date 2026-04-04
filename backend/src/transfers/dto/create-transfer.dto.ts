import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { TransferStatus } from '../entities/transfer.entity';

export class CreateTransferDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  transferNumber: string;

  @IsNotEmpty()
  @IsNumber()
  fromBranchId: number;

  @IsNotEmpty()
  @IsNumber()
  toBranchId: number;

  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @IsNotEmpty()
  @IsNumber()
  requestedBy: number;

  @IsOptional()
  @IsNumber()
  approvedBy?: number;

  @IsNotEmpty()
  @IsDateString()
  transferDate: string;

  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
