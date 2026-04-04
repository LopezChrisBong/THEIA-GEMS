import { PartialType } from '@nestjs/swagger';
import { CreatePromotionalMessageDto } from './create-promotional-message.dto';

export class UpdatePromotionalMessageDto extends PartialType(CreatePromotionalMessageDto) {}
