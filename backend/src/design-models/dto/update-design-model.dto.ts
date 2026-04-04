import { PartialType } from '@nestjs/mapped-types';
import { CreateDesignModelDto } from './create-design-model.dto';

export class UpdateDesignModelDto extends PartialType(CreateDesignModelDto) {}
