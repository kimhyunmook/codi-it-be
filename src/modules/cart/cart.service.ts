import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cart, CartItem } from '@prisma/client';
import { JwtPayload } from 'src/modules/auth/dto/payload.interface';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UpdateCartDto } from './dto/update-cart.dto';
import { UserId } from 'src/types/common';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async createCart(user: JwtPayload): Promise<Cart> {
    const existingCart = await this.prisma.cart.findUnique({ where: { buyerId: user.sub } });
    if (existingCart) return existingCart;

    return this.prisma.cart.create({
      data: {
        buyerId: user.sub,
      },
    });
  }

  async getCart(user: JwtPayload): Promise<Cart> {
    if (user.type !== 'BUYER') {
      throw new ForbiddenException('구매자만 장바구니를 조회할 수 있습니다.');
    }

    const cart = await this.prisma.cart.findUnique({
      where: { buyerId: user.sub },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: true,
                stocks: {
                  include: {
                    size: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new ForbiddenException('장바구니가 존재하지 않습니다.');
    }

    return cart;
  }

  async updateCart(userId: UserId['userId'], dto: UpdateCartDto): Promise<CartItem> {
    if (dto.quantity < 1) {
      throw new BadRequestException('수량은 1 이상이어야 합니다.');
    }

    // 재고 확인
    const stock = await this.prisma.stock.findFirst({
      where: {
        productId: dto.productId,
        sizeId: dto.sizeId,
      },
    });

    if (!stock) {
      throw new BadRequestException('해당 사이즈의 재고가 존재하지 않습니다.');
    }

    if (stock.quantity < dto.quantity) {
      throw new BadRequestException(`재고가 부족합니다. 현재 수량: ${stock.quantity}`);
    }

    // 장바구니 조회
    const cart = await this.prisma.cart.findUnique({
      where: { buyerId: userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                stocks: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new ForbiddenException('장바구니가 존재하지 않습니다.');
    }

    // 기존 장바구니 아이템 존재 여부 확인
    const existingItem = cart.items.find(
      (item) =>
        item.productId === dto.productId &&
        item.product.stocks.some((stock) => stock.sizeId === dto.sizeId),
    );

    if (existingItem) {
      // 수량 차이 계산
      // const quantityDiff = dto.quantity - existingItem.quantity;

      // cart.quantity 업데이트 (수량 차이만큼 증감)
      // await this.prisma.cart.update({
      //   where: { id: cart.id },
      //   data: {
      //     quantity: { increment: quantityDiff },
      //   },
      // });

      // 기존 장바구니 아이템 수량 수정
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: dto.quantity,
        },
      });
    } else {
      // 새 장바구니 아이템 추가
      // cart.quantity에 새 수량 더하기
      // await this.prisma.cart.update({
      //   where: { id: cart.id },
      //   data: {
      //     quantity: { increment: dto.quantity },
      //   },
      // });

      return this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          sizeId: dto.sizeId,
          quantity: dto.quantity,
        },
      });
    }
  }

  async deleteCartItem(userId: string, cartItemId: string) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem) {
      throw new NotFoundException('장바구니 아이템이 존재하지 않습니다.');
    }

    if (cartItem.cart.buyerId !== userId) {
      throw new ForbiddenException('해당 장바구니 아이템을 삭제할 권한이 없습니다.');
    }

    return this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  }

  async getCartItemDetail(userId: string, cartItemId: string) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        product: true,
        cart: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('장바구니 아이템이 존재하지 않습니다.');
    }

    if (cartItem.cart.buyerId !== userId) {
      throw new ForbiddenException('해당 장바구니 아이템을 조회할 권한이 없습니다.');
    }

    return cartItem;
  }
}
