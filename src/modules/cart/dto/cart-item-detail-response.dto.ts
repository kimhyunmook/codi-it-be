import { ApiProperty } from '@nestjs/swagger';

class ProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storeId?: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  image?: string;

  @ApiProperty()
  discountRate?: number;

  @ApiProperty()
  discountStartTime?: Date;

  @ApiProperty()
  discountEndTime?: Date;

  @ApiProperty()
  createdAt?: Date;

  @ApiProperty()
  updatedAt?: Date;
}

class CartDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  buyerId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CartItemDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  cartId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  sizeId?: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: ProductDto })
  product: ProductDto;

  @ApiProperty({ type: CartDto })
  cart: CartDto;
}
