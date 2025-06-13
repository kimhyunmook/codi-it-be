// order-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

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

  @ApiProperty({ type: ProductDto })
  product: ProductDto;

  @ApiProperty({ type: SizeDto })
  size: SizeDto;
}

export class PaymentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;
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
