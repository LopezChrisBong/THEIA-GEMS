import {
  IsString,
  IsOptional,
  IsInt,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  categoryName: string;

  @IsInt()
  @IsOptional()
  parentCategoryId?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
