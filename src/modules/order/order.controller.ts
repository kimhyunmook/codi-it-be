import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Body,
  Post,
  Patch,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';
import { SwaggerErrorExamples } from 'src/common/utils/swagger-error-response.util';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '주문 목록 조회(페이지네이션 포함)',
    description: '로그인한 사용자의 모든 주문을 페이지네이션 포함하여 조회합니다.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: '페이지 번호' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 3,
    description: '페이지당 항목 수',
  })
  @ApiOkResponse({
    description: '주문 목록 조회 성공',
    type: [OrderResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: '인증을 실패 했습니다.',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없습니다.',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  @ApiResponse({
    status: 403,
    description: '권한이 필요합니다.',
    schema: { example: SwaggerErrorExamples.Forbidden },
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['CompletedPayment'],
    description: '주문 상태 필터링 (예: CompletedPayment)',
  })
  async getOrders(
    @CurrentUser('sub') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: 'CompletedPayment',
  ) {
    return this.orderService.getOrdersWithDetails(userId, Number(page), Number(limit), status);
  }

  @Get(':orderId')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: '주문 상세 조회(OrderId)',
    description: '특정 주문의 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'orderId', description: '주문 ID' })
  @ApiOkResponse({
    description: '주문 상세 조회 성공',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '사용자를 찾을 수 없습니다.',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청입니다',
    schema: { example: SwaggerErrorExamples.BadRequest },
  })
  @ApiResponse({
    status: 404,
    description: '주문은 찾을 수 없습니다.',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  @ApiResponse({
    status: 403,
    description: '권한이 필요합니다.',
    schema: { example: SwaggerErrorExamples.Forbidden },
  })
  async getOrderDetail(@CurrentUser('sub') userId: string, @Param('orderId') orderId: string) {
    return this.orderService.getOrderDetail(userId, orderId);
  }

  @UseGuards(AuthGuard)
  @Delete(':orderId')
  @ApiOperation({ summary: '주문 취소(OrderId)' })
  @ApiResponse({
    status: 201,
    description: '주문 취소 성공',
    schema: {
      type: 'null',
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    schema: { example: SwaggerErrorExamples.BadRequest },
  })
  @ApiResponse({
    status: 404,
    description: '주문을 찾을 수 없습니다',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  @ApiResponse({
    status: 403,
    description: '사용자를 찾을 수 없습니다.',
    schema: { example: SwaggerErrorExamples.Forbidden },
  })
  @ApiResponse({
    status: 401,
    description: '인증이 필요합니다.',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiParam({ name: 'orderId', description: '취소할 주문 ID', example: 'order1' })
  async cancelOrder(@Param('orderId') orderId: string, @CurrentUser('sub') userId: string) {
    return this.orderService.cancelOrder(orderId, userId);
  }

  @UseGuards(AuthGuard)
  @Post()
  @ApiOperation({ summary: '주문 생성' })
  @ApiResponse({
    status: 201,
    description: '주문 생성 성공',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    schema: { example: SwaggerErrorExamples.BadRequest },
  })
  @ApiResponse({
    status: 401,
    description: '사용자를 찾을 수 없습니다.',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiResponse({
    status: 403,
    description: '권한이 없습니다.',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  async createOrder(@Body() dto: CreateOrderDto, @CurrentUser('sub') userId: string) {
    return this.orderService.createOrder(userId, dto);
  }

  @UseGuards(AuthGuard)
  @Patch(':orderId')
  @ApiOperation({
    summary: '주문 정보 수정(이름/전화번호/배송지)',
    description: ' 구매자 이름, 전화번호, 배송지를 수정합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '주문 수정 성공',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    schema: { example: SwaggerErrorExamples.BadRequest },
  })
  @ApiResponse({
    status: 404,
    description: '주문을 찾을 수 없습니다',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  @ApiResponse({
    status: 401,
    description: '사용자를 찾을 수 없습니다.',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiResponse({
    status: 403,
    description: '권한이 없습니다.',
    schema: { example: SwaggerErrorExamples.Forbidden },
  })
  async updateOrder(@Param('orderId') orderId: string, @Body() dto: UpdateOrderDto) {
    return this.orderService.updateOrder(orderId, dto);
  }
}
