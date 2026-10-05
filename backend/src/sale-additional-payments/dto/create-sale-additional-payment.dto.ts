import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateSaleAdditionalPaymentDto {
  @IsNotEmpty()
  @IsNumber()
  saleId: number;

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;
}
