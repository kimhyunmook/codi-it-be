// order-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Payment, PaymentStatus } from '@prisma/client';

export class ReviewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  content: string;

  @ApiProperty()
  createdAt: Date;
}

export class ProductDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: [ReviewDto] })
  reviews: ReviewDto[];
}

export class SizeInfoDto {
  @ApiProperty()
  en: string;

  @ApiProperty()
  ko: string;
}

export class SizeDto {
  @ApiProperty({ type: SizeInfoDto })
  size: SizeInfoDto;
}

export class OrderItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  prductId: string;

  @ApiProperty({ type: ProductDto })
  product: ProductDto;

  @ApiProperty({ type: SizeDto })
  size: SizeDto;
}

enum PaymentStatusEnum {
  CompletedPayment = 'CompletedPayment',
  CancelledPayment = 'CancelledPayment',
  WaitingPayment = 'WaitingPayment',
}

export class PaymentDto implements Payment {
  @ApiProperty({ example: 'CUID', description: 'payment ID' })
  id: string;

  @ApiProperty({ example: 30000, description: '최종 결제 가격' })
  price: number;

  @ApiProperty({
    example: PaymentStatus.CompletedPayment,
    description: '결제 상태',
    enum: PaymentStatusEnum,
  })
  status: PaymentStatus;

  @ApiProperty({
    example: new Date(),
    description: '생산 날짜',
  })
  createdAt: Date;

  @ApiProperty({
    example: new Date(),
    description: '업데이트 날짜 (결제 완료, 결제 취소)',
  })
  updatedAt: Date;

  @ApiProperty({
    example: 'CUID',
    description: '주문 ID',
  })
  orderId: string;
}

export class OrderResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  totalQuantity: number;

  @ApiProperty()
  usePoint: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: [OrderItemDto] })
  orderItems: OrderItemDto[];

  @ApiProperty({ type: PaymentDto })
  payments: PaymentDto;
}
