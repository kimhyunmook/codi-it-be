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

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrdersWithDetails(userId: string, page = 1, limit = 10, status?: 'CompletedPayment') {
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
              product: {
                select: {
                  name: true,
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
            product: {
              select: {
                name: true,
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

    // 총 금액, 수량 계산용
    let subtotal = 0;
    let totalQuantity = 0;

    // Prisma 타입 명시: OrderItemCreateWithoutOrderInput[]
    const orderItemCreates: Prisma.OrderItemCreateWithoutOrderInput[] = [];

    const stockUpdates: { stockId: string; decrementBy: number }[] = [];

    for (const item of orderItems) {
      // 상품 조회
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
          `상품 ${item.productId}의 해당 사이즈 재고가 존재하지 않습니다`,
        );
      }

      if (stock.quantity < item.quantity) {
        throw new BadRequestException(
          `상품 ${product.name}(${item.sizeId})의 재고가 부족합니다. 현재 재고: ${stock.quantity}`,
        );
      }

      subtotal += product.price * item.quantity;
      totalQuantity += item.quantity;

      // OrderItem create 배열에 추가
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

    // 사용자 조회
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('사용자를 찾을 수 없습니다.');

    if (usePoint > user.points) {
      throw new BadRequestException('사용 가능한 포인트를 초과했습니다.');
    }

    const paymentPrice = subtotal - usePoint;
    if (paymentPrice < 0) {
      throw new BadRequestException('사용할 포인트가 주문 금액을 초과할 수 없습니다.');
    }

    // 트랜잭션 실행
    return this.prisma.$transaction(async (tx) => {
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

      await tx.payment.create({
        data: {
          orderId: order.id,
          price: paymentPrice,
          status: 'WaitingPayment',
          createdAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          points: user.points - usePoint,
        },
      });

      for (const { stockId, decrementBy } of stockUpdates) {
        await tx.stock.update({
          where: { id: stockId },
          data: {
            quantity: {
              decrement: decrementBy,
            },
          },
        });
      }

      return order;
    });
  }

  async updateExpiredPayments() {
    const now = new Date();
    const expiredDate = addDays(now, -14); // 14일 전 날짜 계산

    await this.prisma.payment.updateMany({
      where: {
        status: 'WaitingPayment', // 대기 상태 중에서
        createdAt: { lte: expiredDate }, // 생성일이 14일 이전인 것들만
      },
      data: {
        status: 'CompletedPayment', // 상태 변경
      },
    });
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
