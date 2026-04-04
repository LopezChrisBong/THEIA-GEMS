import { PartialType } from '@nestjs/mapped-types';
import { CreateJewelryTypeDto } from './create-jewelry-type.dto';

export class UpdateJewelryTypeDto extends PartialType(CreateJewelryTypeDto) {}
