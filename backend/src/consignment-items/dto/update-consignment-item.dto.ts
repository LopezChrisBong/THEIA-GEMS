import { PartialType } from '@nestjs/mapped-types';
import { CreateConsignmentItemDto } from './create-consignment-item.dto';

export class UpdateConsignmentItemDto extends PartialType(CreateConsignmentItemDto) {}
