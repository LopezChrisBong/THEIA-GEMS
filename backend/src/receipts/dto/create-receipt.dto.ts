import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateReceiptDto {
  @IsNotEmpty()
  @IsNumber()
  saleId: number;

  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @IsNotEmpty()
  @IsNumber()
  branchId: number;

  @IsOptional()
  @IsString()
  headerText?: string;

  @IsOptional()
  @IsString()
  footerText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  logoUrl?: string;

  @IsOptional()
  @IsNumber()
  printedBy?: number;
}
