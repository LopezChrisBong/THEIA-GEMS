import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { MessageType, SendMethod, MessageStatus } from '../entities/promotional-message.entity';

export class CreatePromotionalMessageDto {
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @IsOptional()
  @IsNumber()
  customerId?: number;

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
