import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateUserActivityLogDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  activityType: string;

  @IsOptional()
  @IsString()
  activityDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  module?: string;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;
}
