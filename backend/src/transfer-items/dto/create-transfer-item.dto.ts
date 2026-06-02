import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTransferItemDto {
  @IsNotEmpty()
  @IsNumber()
  transferId: number;

  @IsNotEmpty()
  @IsNumber()
  jewelryItemId: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
