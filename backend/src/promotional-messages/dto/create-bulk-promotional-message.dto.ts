import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsArray,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import {
  MessageType,
  SendMethod,
  MessageStatus,
} from '../entities/promotional-message.entity';

export class CreateBulkPromotionalMessageDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  customerIds: number[];

  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @IsNotEmpty()
  @IsEnum(SendMethod)
  sendMethod: SendMethod;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsNotEmpty()
  @IsString()
  messageContent: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;

  @IsNotEmpty()
  @IsNumber()
  createdBy: number;
}
