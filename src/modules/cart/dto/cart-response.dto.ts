import { ApiProperty } from '@nestjs/swagger';

class SizeInfoDto {
  @ApiProperty()
  en: string;

  @ApiProperty()
  ko: string;
}

class SizeDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ type: SizeInfoDto })
  size: SizeInfoDto;
}

class StockDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  sizeId: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ type: SizeDto })
  size: SizeDto;
}

class StoreDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  image: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

class ProductDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storeId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  image: string;

  @ApiProperty()
  discountRate: number;

  @ApiProperty()
  discountStartTime: Date;

  @ApiProperty()
  discountEndTime: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: StoreDto })
  store: StoreDto;

  @ApiProperty({ type: [StockDto] })
  stocks: StockDto[];
}

class CartItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  cartId: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  sizeId: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: ProductDto })
  product: ProductDto;
}

export class CartResponseDto {
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

  @ApiProperty({ type: [CartItemDto] })
  items: CartItemDto[];
}
