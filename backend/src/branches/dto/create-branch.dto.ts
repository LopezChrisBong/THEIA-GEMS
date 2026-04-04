import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  branchName: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  branchCode?: string;

  @IsString()
  @IsOptional()
  address?: string;

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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
