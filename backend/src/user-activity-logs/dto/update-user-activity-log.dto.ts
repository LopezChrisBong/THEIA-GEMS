import { PartialType } from '@nestjs/swagger';
import { CreateUserActivityLogDto } from './create-user-activity-log.dto';

export class UpdateUserActivityLogDto extends PartialType(CreateUserActivityLogDto) {}
