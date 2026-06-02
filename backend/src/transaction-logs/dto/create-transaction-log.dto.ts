import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsObject,
  MaxLength,
} from 'class-validator';
import { TransactionAction } from '../entities/transaction-log.entity';

export class CreateTransactionLogDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  transactionType: string;

  @IsNotEmpty()
  @IsNumber()
  transactionId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  tableName: string;

  @IsNotEmpty()
  @IsEnum(TransactionAction)
  action: TransactionAction;

  @IsOptional()
  @IsObject()
  oldValues?: Record<string, any>;

  @IsOptional()
  @IsObject()
  newValues?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  performedBy?: number;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
