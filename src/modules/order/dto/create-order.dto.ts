import { IsNotEmpty, IsString, IsPhoneNumber, IsArray, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ example: 'product1', description: '주문할 상품 ID' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({ example: 1, description: '사이즈 ID' })
  @IsNotEmpty()
  @IsNumber()
  sizeId: number;

  @ApiProperty({ example: 2, description: '상품 수량' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: '김유저', description: '구매자 이름' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: '010-1234-5678', description: '구매자 연락처' })
  @IsPhoneNumber('KR')
  phone: string;

  @ApiProperty({ example: '서울특별시 강남구', description: '배송지 주소' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ type: [CreateOrderItemDto], description: '주문할 상품 목록' })
  @IsArray()
  orderItems: CreateOrderItemDto[];

  @ApiProperty({ example: 1000, description: '사용할 포인트 (0 이상)' })
  @IsNumber()
  @Min(0)
  usePoint: number;
}
