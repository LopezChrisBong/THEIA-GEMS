import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { GoldType, JewelryItemStatus } from '../entities/jewelry-item.entity';

export class CreateJewelryItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  itemCode: string;

  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  brand?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  color?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  material?: string;

  @IsInt()
  @IsOptional()
  stoneTypeId?: number;

  @IsInt()
  @IsOptional()
  jewelryTypeId?: number;

  @IsEnum(GoldType)
  @IsOptional()
  goldType?: GoldType;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  carat?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  goldWeight?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  karat?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  size?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  ringSize?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  bandWidth?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsEnum(JewelryItemStatus)
  @IsOptional()
  status?: JewelryItemStatus;

  @IsInt()
  @IsNotEmpty()
  branchId: number;

  @IsInt()
  @IsOptional()
  supplierId?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  supplierCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  barcode?: string;

  @IsInt()
  @IsOptional()
  parentItemId?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  saleDate?: string;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  addedBy?: number;
}
