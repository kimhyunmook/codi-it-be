import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtPayload } from 'src/modules/auth/dto/payload.interface';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { UpdateCartDto } from './dto/update-cart.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { CartItemDetailDto } from './dto/cart-item-detail-response.dto';
import { SwaggerErrorExamples } from 'src/common/utils/swagger-error-response.util';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UserId } from 'src/types/common';

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  @ApiOperation({ summary: '장바구니 생성' })
  @ApiResponse({
    status: 201,
    description: '장바구니가 성공적으로 생성되었습니다.',
    schema: {
      example: {
        id: 'cart1',
        buyerId: 'buyer',
        quantity: 2,
        createdAt: '2025-06-02T07:44:08.294Z',
        updatedAt: '2025-06-02T07:44:08.294Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청입니다.',
    schema: { example: SwaggerErrorExamples.BadRequest },
  })
  @ApiResponse({
    status: 401,
    description: '인증에 실패했습니다.',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiResponse({
    status: 403,
    description: '권한애 없습니다.',
    schema: { example: SwaggerErrorExamples.Forbidden },
  })
  async createCart(@Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    if (!user) {
      throw new Error('사용자 정보가 없습니다. 인증이 필요합니다.');
    }
    return this.cartService.createCart(user);
  }

  @Get()
  @ApiOperation({ summary: '장바구니 조회' })
  @ApiResponse({
    status: 200,
    description: '장바구니가 성공적으로 조회되었습니다.',
    type: CartResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증에 실패했습니다.',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiResponse({
    status: 403,
    description: '권한이 없습니다.',
    schema: { example: SwaggerErrorExamples.Forbidden },
  })
  @ApiResponse({
    status: 404,
    description: '장바구니에 아이템이 없습니다.',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청입니다.',
    schema: { example: SwaggerErrorExamples.BadRequest },
  })
  async getCart(@Req() req: Request) {
    const user = (req as any).user as JwtPayload;
    return this.cartService.getCart(user);
  }

  @Patch()
  @ApiOperation({
    summary: ' 장바구니 수정(아이템 추가/아이템 수량 수정)',
    description: '상품을 추가하거나 수량을 수정합니다',
  })
  @ApiResponse({
    status: 200,
    description: '장바구니가 성공적으로 수정되었습니다.',
    type: CartItemDetailDto,
  })
  @ApiResponse({
    status: 200,
    description: '장바구니가 성공적으로 수정되었습니다.',
    schema: {
      example: {
        id: 'cartItem123',
        cartId: 'cart123',
        productId: 'product123',
        sizeId: 'size123',
        quantity: 2,
        createdAt: '2025-06-03T12:00:00.000Z',
        updatedAt: '2025-06-03T12:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청입니다.',
    schema: { example: SwaggerErrorExamples.BadRequest },
  })
  @ApiResponse({
    status: 403,
    description: '권한이 없습니다',
    schema: { example: SwaggerErrorExamples.Forbidden },
  })
  @ApiResponse({
    status: 401,
    description: '인증이 필요합니다',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  async updateCart(@CurrentUser('sub') userId: UserId['userId'], @Body() dto: UpdateCartDto) {
    return this.cartService.updateCart(userId, dto);
  }

  @Delete('/:cartItemId')
  @ApiOperation({ summary: '장바구니 아이템 삭제(카트 아이템 ID)' })
  @ApiParam({
    name: 'cartItemId',
    description: '삭제할 장바구니 아이템 ID',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: '삭제에 성공했습니다',
    schema: {
      type: 'null',
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증에 실패했습니다.',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiResponse({
    status: 403,
    description: '권한이 없습니다.',
    schema: { example: SwaggerErrorExamples.Forbidden },
  })
  @ApiResponse({
    status: 404,
    description: '장바구니에 아이템이 없습니다.',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  async deleteCartItem(
    @CurrentUser('sub') userId: UserId['userId'],
    @Param('cartItemId') cartItemId: string,
  ): Promise<void> {
    await this.cartService.deleteCartItem(userId, cartItemId);
  }

  @Get('/:cartItemId')
  @ApiOperation({ summary: '장바구니 아이템 상세 조회(카트 아이템 ID)' })
  @ApiResponse({
    status: 200,
    description: '장바구니 아이템 상세 조회에 성공했습니다.',
    type: CartItemDetailDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증에 실패했습니다.',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiResponse({
    status: 403,
    description: '권한이 없습니다.',
    schema: { example: SwaggerErrorExamples.Forbidden },
  })
  @ApiResponse({
    status: 404,
    description: '장바구니에 아이템이 없습니다.',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  async getCartItemDetail(
    @CurrentUser('sub') userId: UserId['userId'],
    @Param('cartItemId') cartItemId: string,
  ) {
    return this.cartService.getCartItemDetail(userId, cartItemId);
  }
}
