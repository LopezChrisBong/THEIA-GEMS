import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTransferItemDto {
  @IsNotEmpty()
  @IsNumber()
  transferId: number;

  @IsNotEmpty()
  @IsNumber()
  jewelryItemId: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
