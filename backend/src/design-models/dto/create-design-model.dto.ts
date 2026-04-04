import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDesignModelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  modelName: string;

  @IsString()
  @IsOptional()
  description?: string;
}
