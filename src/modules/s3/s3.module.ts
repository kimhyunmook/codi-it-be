import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './s3.service';
import { S3Interceptor } from 'src/common/interceptor/s3.interceptor';

@Module({
  imports: [ConfigModule],
  providers: [S3Service, S3Interceptor],
  exports: [S3Service, S3Interceptor],
})
export class S3Module {}
