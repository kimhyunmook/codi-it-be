import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cart, CartItem } from '@prisma/client';
import { JwtPayload } from 'src/modules/auth/dto/payload.interface';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UpdateCartBySizesDto } from './dto/update-cart.dto';
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

  // cart.service.ts

  async updateCartBySizes(
    userId: UserId['userId'],
    dto: UpdateCartBySizesDto,
  ): Promise<CartItem[]> {
    const cart = await this.prisma.cart.findUnique({
      where: { buyerId: userId },
      include: { items: true },
    });

    if (!cart) {
      throw new ForbiddenException('장바구니가 존재하지 않습니다.');
    }

    const results: CartItem[] = [];

    for (const { sizeId, quantity } of dto.sizes) {
      if (quantity < 1) continue;

      const stock = await this.prisma.stock.findFirst({
        where: {
          productId: dto.productId,
          sizeId,
        },
      });

      if (!stock) {
        throw new BadRequestException(`사이즈 ${sizeId}의 재고가 존재하지 않습니다.`);
      }

      if (stock.quantity < quantity) {
        throw new BadRequestException(
          `사이즈 ${sizeId}의 재고가 부족합니다. 현재 수량: ${stock.quantity}`,
        );
      }

      const existingItem = cart.items.find(
        (item) => item.productId === dto.productId && item.sizeId === sizeId,
      );

      if (existingItem) {
        const updated = await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity },
        });
        results.push(updated);
      } else {
        const created = await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: dto.productId,
            sizeId,
            quantity,
          },
        });
        results.push(created);
      }
    }

    return results;
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
