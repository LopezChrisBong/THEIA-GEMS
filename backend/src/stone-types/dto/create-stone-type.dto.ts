import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateStoneTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
