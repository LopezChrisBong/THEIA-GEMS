import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class CreateJewelryItemImageDto {
  @IsInt()
  @IsNotEmpty()
  jewelryItemId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  imagePath: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
