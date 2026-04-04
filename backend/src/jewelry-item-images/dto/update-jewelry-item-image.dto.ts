import { PartialType } from '@nestjs/mapped-types';
import { CreateJewelryItemImageDto } from './create-jewelry-item-image.dto';

export class UpdateJewelryItemImageDto extends PartialType(CreateJewelryItemImageDto) {}
