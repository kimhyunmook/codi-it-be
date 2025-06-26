import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { InquiryService } from '../inquiry/inquiry.service';
import { S3Module } from '../s3/s3.module';
import { AlarmService } from '../alarm/alarm.service';

@Module({
  imports: [S3Module],
  controllers: [ProductController],
  providers: [ProductService, InquiryService, AlarmService],
})
export class ProductModule {}
