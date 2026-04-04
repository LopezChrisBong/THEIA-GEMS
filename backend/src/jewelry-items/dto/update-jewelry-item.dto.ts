import { PartialType } from '@nestjs/mapped-types';
import { CreateJewelryItemDto } from './create-jewelry-item.dto';

export class UpdateJewelryItemDto extends PartialType(CreateJewelryItemDto) {}
