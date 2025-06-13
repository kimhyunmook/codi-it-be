import { PartialType } from '@nestjs/swagger';
import { CreateAlarmDto } from './create-alarm.dto';

export class UpdateAlarmDto extends PartialType(CreateAlarmDto) {}
