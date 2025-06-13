// alarm.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class AlarmService {
  constructor(private readonly prisma: PrismaService) {}

  // 알람 생성
  async createAlarm(userId: string, content: string) {
    return await this.prisma.alarm.create({
      data: {
        userId,
        content,
      },
    });
  }

  // 알람 조회
  async getAlarmsByUser(userId: string) {
    return await this.prisma.alarm.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async alarmAsChecked(alarmId: string, userId: string) {
    const alarm = await this.prisma.alarm.findUnique({
      where: { id: alarmId },
    });

    if (!alarm) {
      throw new NotFoundException('알람을 찾을 수 없습니다.');
    }

    if (alarm.userId !== userId) {
      throw new ForbiddenException('해당 알람에 대한 접근 권한이 없습니다.');
    }

    return this.prisma.alarm.update({
      where: { id: alarmId },
      data: { isChecked: true },
    });
  }

  // 결제 상태가 CompletedPayment로 변경되었을 때 알람 생성
  async createPurchaseConfirmedAlarm(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
            user: true,
          },
        },
      },
    });

    if (!payment || payment.status !== PaymentStatus.CompletedPayment) return;

    for (const item of payment.order.orderItems) {
      const productName = item.product.name;
      const content = `${productName}이 구매 확정되었습니다.`;
      await this.createAlarm(payment.order.userId, content);
    }
  }

  // 스토어 상품 품절 알람
  async createOutOfStockAlarm(productId: string, sizeId: number) {
    const stock = await this.prisma.stock.findFirst({
      where: { productId, sizeId },
      include: {
        product: {
          include: {
            store: true,
          },
        },
        size: true,
      },
    });

    if (!stock || stock.quantity > 0) return;

    const storeOwnerId = stock.product.store.userId;
    const sizeName = (stock.size.size as any).kr || '해당 사이즈';
    const productName = stock.product.name;

    const content = `${productName}의 ${sizeName} 사이즈가 품절되었습니다.`;
    await this.createAlarm(storeOwnerId, content);
  }

  // 찜한 스토어에 상품 추가 시 알람 생성
  async createNewProductInFavoriteStoreAlarm(storeId: string, productName: string) {
    const favoriteUsers = await this.prisma.favoriteStore.findMany({
      where: { storeId },
      include: { user: true },
    });

    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return;

    const content = `${store.name}에서 ${productName}이 추가되었습니다.`;

    for (const favorite of favoriteUsers) {
      await this.createAlarm(favorite.userId, content);
    }
  }

  // alarm.service.ts
  async getUncheckedAlarms(userId: string) {
    return await this.prisma.alarm.findMany({
      where: {
        userId,
        isChecked: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
