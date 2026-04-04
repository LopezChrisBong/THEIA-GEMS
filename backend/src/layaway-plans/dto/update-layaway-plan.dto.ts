import { PartialType } from '@nestjs/swagger';
import { CreateLayawayPlanDto } from './create-layaway-plan.dto';

export class UpdateLayawayPlanDto extends PartialType(CreateLayawayPlanDto) {}
