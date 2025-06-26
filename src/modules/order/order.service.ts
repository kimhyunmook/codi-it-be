import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Prisma } from '@prisma/client';
import { addDays } from 'date-fns';
import { UpdateOrderDto } from './dto/update-order.dto';
import { calculateShippingFee } from 'src/common/utils/shipping.util';
import { AlarmService } from 'src/modules/alarm/alarm.service';
// import { UserId } from 'src/types/common';
// import { PaymentDto } from './dto/order-response.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alarmService: AlarmService,
  ) {}

  async getOrdersWithFilter(userId: string, page = 1, limit = 10, status?: 'CompletedPayment') {
    const skip = (page - 1) * limit;

    const whereClause: Prisma.OrderWhereInput = {
      userId,
      ...(status === 'CompletedPayment' && {
        payments: {
          is: {
            status: 'CompletedPayment',
          },
        },
      }),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          address: true,
          phoneNumber: true,
          subtotal: true,
          totalQuantity: true,
          usePoint: true,
          createdAt: true,
          orderItems: {
            select: {
              id: true,
              price: true,
              quantity: true,
              isReviewed: true,
              productId: true,
              product: {
                select: {
                  name: true,
                  image: true,
                  reviews: {
                    where: { userId },
                    select: {
                      id: true,
                      rating: true,
                      content: true,
                      createdAt: true,
                    },
                  },
                },
              },
              size: {
                select: {
                  size: true,
                },
              },
            },
          },
          payments: {
            select: {
              id: true,
              price: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where: whereClause }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderDetail(userId: string, orderId: string) {
    // 본인 주문인지 체크하려면 userId 조건 추가 가능
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId }, // 본인 주문만 조회 가능하도록
      select: {
        id: true,
        name: true,
        address: true,
        phoneNumber: true,
        subtotal: true,
        totalQuantity: true,
        usePoint: true,
        createdAt: true,
        orderItems: {
          select: {
            id: true,
            price: true,
            quantity: true,
            productId: true,
            isReviewed: true, // 리뷰 여부 추가
            product: {
              select: {
                name: true,
                image: true,
                reviews: {
                  where: { userId }, // 해당 사용자 리뷰만
                  select: {
                    id: true,
                    rating: true,
                    content: true,
                    createdAt: true,
                  },
                },
              },
            },
            size: {
              select: {
                size: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            price: true,
            status: true, // 결제 상태 포함
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    return order;
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
        orderItems: {
          include: {
            product: true,
            size: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('본인의 주문만 취소할 수 있습니다.');
    }

    // ✅ 명시적으로 null 체크
    const payment = order.payments;
    if (!payment) {
      throw new BadRequestException('결제 정보가 없습니다.');
    }

    if (payment.status !== 'WaitingPayment') {
      throw new BadRequestException('현재 상태에서는 주문을 취소할 수 없습니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'CancelledPayment' },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          points: { increment: order.usePoint },
        },
      });

      for (const item of order.orderItems) {
        const stock = await tx.stock.findFirst({
          where: {
            productId: item.productId,
            sizeId: item.sizeId,
          },
        });

        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return { message: '주문이 성공적으로 취소되고 포인트가 복구되었습니다.' };
    });
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const { name, phone, address, orderItems, usePoint } = dto;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      throw new BadRequestException('주문할 상품이 존재하지 않습니다.');
    }

    let subtotal = 0;
    let totalQuantity = 0;

    const orderItemCreates: Prisma.OrderItemCreateWithoutOrderInput[] = [];
    const stockUpdates: { stockId: string; decrementBy: number }[] = [];

    for (const item of orderItems) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        throw new BadRequestException(`상품 ${item.productId} 을 찾을 수 없습니다.`);
      }

      const stock = await this.prisma.stock.findFirst({
        where: {
          productId: item.productId,
          sizeId: item.sizeId,
        },
      });

      if (!stock) {
        throw new BadRequestException(
          `상품 ${item.productId}의 해당 사이즈 재고가 존재하지 않습니다.`,
        );
      }

      if (stock.quantity < item.quantity) {
        throw new BadRequestException(
          `상품 ${product.name}(${item.sizeId})의 재고가 부족합니다. 현재 재고: ${stock.quantity}`,
        );
      }

      subtotal += product.price * item.quantity;
      totalQuantity += item.quantity;

      orderItemCreates.push({
        product: { connect: { id: product.id } },
        size: { connect: { id: item.sizeId } },
        price: product.price,
        quantity: item.quantity,
      });

      stockUpdates.push({ stockId: stock.id, decrementBy: item.quantity });
    }

    const shippingFee = calculateShippingFee(subtotal);
    const totalPrice = subtotal + shippingFee;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { grade: true },
    });
    if (!user) throw new BadRequestException('사용자를 찾을 수 없습니다.');

    if (usePoint > user.points) {
      throw new BadRequestException('사용 가능한 포인트를 초과했습니다.');
    }

    const paymentPrice = subtotal - usePoint;
    if (paymentPrice < 0) {
      throw new BadRequestException('사용할 포인트가 주문 금액을 초과할 수 없습니다.');
    }

    const rate = user.grade?.rate ?? 0;
    const earnedPoint = Math.floor(subtotal * (rate / 100));

    // 트랜잭션 외부로 알람 생성용 품절 리스트 저장
    const outOfStockList: { productId: string; sizeId: number }[] = [];

    const { order } = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          name,
          phoneNumber: phone,
          address,
          subtotal: totalPrice,
          totalQuantity,
          usePoint,
          orderItems: {
            create: orderItemCreates,
          },
        },
      });

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          price: paymentPrice,
          status: 'CompletedPayment', // 바로 결제 완료 상태
          createdAt: new Date(),
        },
        include: {
          order: {
            include: {
              orderItems: {
                include: { product: true },
              },
            },
          },
        },
      });

      const saleLogCreateInput = payment.order.orderItems.map(
        (item): Prisma.SalesLogCreateManyInput => ({
          price: item.price * item.quantity,
          productId: item.productId,
          userId,
          quantity: item.quantity,
          storeId: item.product.storeId,
        }),
      );

      await tx.salesLog.createMany({ data: saleLogCreateInput });

      const salesLog = await tx.salesLog.findMany({
        where: {
          userId,
        },
        select: {
          price: true,
        },
      });
      const accumulated = salesLog.reduce((a, c) => a + c.price, 0);
      const grade = await tx.grade.findMany({ select: { minAmount: true, id: true } });
      let foundIndex = -1;
      let updateGradeId = user.grade.id;
      for (let i = 0; i < grade.length - 1; i++) {
        if (accumulated >= grade[i].minAmount && accumulated < grade[i + 1].minAmount) {
          foundIndex = i;
          break;
        }
      }
      if (foundIndex !== -1) {
        updateGradeId = grade[foundIndex].id;
      } else {
        updateGradeId = grade.find((x) => x.id === 'grade_vip')!.id;
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          points: user.points - usePoint + earnedPoint,
          gradeId: updateGradeId,
        },
      });

      for (const { stockId, decrementBy } of stockUpdates) {
        const updatedStock = await tx.stock.update({
          where: { id: stockId },
          data: {
            quantity: {
              decrement: decrementBy,
            },
          },
        });

        if (updatedStock.quantity === 0) {
          outOfStockList.push({
            productId: updatedStock.productId,
            sizeId: updatedStock.sizeId,
          });
        }
      }

      return { order };
    });

    // 트랜잭션 외부에서 알람 생성

    // 판매자에게 품절 알람 보내기
    for (const { productId, sizeId } of outOfStockList) {
      await this.alarmService.createOutOfStockAlarm(productId, sizeId);
    }

    // 장바구니에 해당 상품+사이즈 담긴 buyer들에게 품절 알람 보내기
    for (const { productId, sizeId } of outOfStockList) {
      // 품절 상품 재고, 제품명, 사이즈명 조회
      const stock = await this.prisma.stock.findFirst({
        where: { productId, sizeId },
        include: {
          product: true,
          size: true,
        },
      });
      if (!stock) continue;

      // 품절 상품 장바구니에 담긴 모든 유저 조회
      const cartItems = await this.prisma.cartItem.findMany({
        where: {
          productId,
          sizeId,
        },
        include: {
          cart: {
            include: {
              user: true,
            },
          },
        },
      });

      for (const cartItem of cartItems) {
        await this.alarmService.createCartOutOfStockAlarm(
          cartItem.cart.buyerId,
          stock.product.name,
          (stock.size.size as { ko: string }).ko || '해당 사이즈',
        );
      }
    }

    return order;
  }

  async updateExpiredPayments() {
    const now = new Date();
    const expiredDate = addDays(now, -14); // 14일 전

    // 1. 상태가 WaitingPayment이고 14일 이상 지난 결제 찾기 (관련 orderItems 포함)
    const expiredPayments = await this.prisma.payment.findMany({
      where: {
        status: 'WaitingPayment',
        createdAt: { lte: expiredDate },
      },
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

    // 2. 트랜잭션으로 결제 상태 변경 + salesLog 생성 + 알람 생성 처리
    for (const payment of expiredPayments) {
      await this.prisma.$transaction(async (tx) => {
        // 결제 상태 변경
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'CompletedPayment' },
        });

        // salesLog 생성
        const saleLogCreateInput = payment.order.orderItems.map(
          (item): Prisma.SalesLogCreateManyInput => ({
            price: item.price * item.quantity,
            productId: item.productId,
            userId: payment.order.userId,
            quantity: item.quantity,
            storeId: item.product.storeId,
          }),
        );

        await tx.salesLog.createMany({
          data: saleLogCreateInput,
        });

        // 알람 생성
        await this.alarmService.createPurchaseConfirmedAlarm(payment.id);
      });
    }
  }

  async updateOrder(orderId: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    if (!order) {
      throw new BadRequestException('해당 주문을 찾을 수 없습니다.');
    }

    if (order.payments?.status === 'CompletedPayment') {
      throw new BadRequestException('결제가 완료된 주문은 수정할 수 없습니다.');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        name: dto.name,
        phoneNumber: dto.phone,
        address: dto.address,
      },
    });
  }
}
