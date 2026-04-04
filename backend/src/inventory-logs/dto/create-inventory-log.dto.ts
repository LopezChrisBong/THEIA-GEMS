import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ActionType } from '../entities/inventory-log.entity';

export class CreateInventoryLogDto {
  @IsOptional()
  @IsNumber()
  jewelryItemId?: number;

  @IsNotEmpty()
  @IsNumber()
  branchId: number;

  @IsNotEmpty()
  @IsEnum(ActionType)
  actionType: ActionType;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  previousStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  newStatus?: string;

  @IsOptional()
  @IsNumber()
  referenceId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceType?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsNumber()
  performedBy: number;
}
