// task.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderService } from './order.service';

@Injectable()
export class TaskService {
  constructor(private readonly orderService: OrderService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { name: 'update_payment_status_daily' })
  async handlePaymentUpdate() {
    await this.orderService.updateExpiredPayments();
  }
}
