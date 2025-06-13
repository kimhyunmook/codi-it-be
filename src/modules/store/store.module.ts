import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { S3Module } from '../s3/s3.module';
import { UserService } from '../user/user.service';

@Module({
  imports: [S3Module],
  controllers: [StoreController],
  providers: [StoreService, UserService],
})
export class StoreModule {}
