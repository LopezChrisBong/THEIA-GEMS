import { PartialType } from '@nestjs/mapped-types';
import { CreateTransferItemDto } from './create-transfer-item.dto';

export class UpdateTransferItemDto extends PartialType(CreateTransferItemDto) {}
