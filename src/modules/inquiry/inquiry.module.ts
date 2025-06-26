import { Module } from '@nestjs/common';
import { InquiryService } from './inquiry.service';
import { InquiryController } from './inquiry.controller';
import { AlarmService } from '../alarm/alarm.service';

@Module({
  controllers: [InquiryController],
  providers: [InquiryService, AlarmService],
})
export class InquiryModule {}
