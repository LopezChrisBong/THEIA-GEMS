import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateSystemSettingDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  settingKey: string;

  @IsOptional()
  @IsString()
  settingValue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  settingType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  updatedBy?: number;
}
