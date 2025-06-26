import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AuthModule } from '../auth/auth.module';
import { TaskService } from './task.service';
import { AlarmService } from '../alarm/alarm.service';

@Module({
  imports: [AuthModule],
  controllers: [OrderController],
  providers: [OrderService, TaskService, AlarmService],
})
export class OrderModule {}
