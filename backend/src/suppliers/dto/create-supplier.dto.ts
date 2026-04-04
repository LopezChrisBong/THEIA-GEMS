import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsEnum,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { SupplierType } from '../entities/supplier.entity';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  supplierName: string;

  @IsEnum(SupplierType)
  @IsNotEmpty()
  supplierType: SupplierType;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactPerson?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Matches(/^[\d\s\-\+\(\)]*$/, {
    message: 'Phone number can only contain digits, spaces, hyphens, plus signs, and parentheses',
  })
  phone?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(100)
  email?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
