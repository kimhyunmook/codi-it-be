import { ApiProperty } from '@nestjs/swagger';
import { Store } from '@prisma/client';

export class StoreResponse implements Store {
  @ApiProperty({ description: '스토어 ID', example: 'CUID' })
  id: string;

  @ApiProperty({ description: '스토어 이름', example: 'CODI-IT' })
  name: string;

  @ApiProperty({ description: '스토어 생성일', example: '2025-06-01T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '스토어 정보 업데이트일', example: '2025-06-01T13:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ description: '스토어 소유자 유저 ID', example: 'CUID' })
  userId: string;

  @ApiProperty({ description: '주소', example: '서울특별시 강남구 테헤란로 123' })
  address: string;

  @ApiProperty({ description: '상세 주소', example: '1동 1106호' })
  detailAddress: string | null;

  @ApiProperty({ description: '전화번호', example: '010-1234-5678' })
  phoneNumber: string;

  @ApiProperty({ description: '스토어 설명', example: '저희는 CODI-IT 입니다.' })
  content: string;

  @ApiProperty({ description: '가게 이미지 URL', example: 'https://example.com/image.jpg' })
  image: string;
}

export class MyStoreResponse extends StoreResponse {
  @ApiProperty({ description: '등록된 제품 수', example: 32 })
  productCount: number;

  @ApiProperty({ description: '관심 스토어 수', example: 4382 })
  favoriteCount: number;

  @ApiProperty({ description: '이번 달 관심 수', example: 300 })
  monthFavoriteCount: number;

  @ApiProperty({ description: '누적 판매 량', example: 5000 })
  totalSoldCount: number;
}

export class FavoriteStoreResponseDto {
  @ApiProperty({ example: 'register' })
  type: 'register' | 'delete';

  @ApiProperty({ example: StoreResponse })
  store: StoreResponse;
}

export class MyStoreProduct {
  @ApiProperty({ example: 'CUID', description: '상품 ID' })
  id: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: '상품 이미지 URL' })
  image: string;

  @ApiProperty({ example: '가디건', description: '상품 이름' })
  name: string;

  @ApiProperty({ example: 29900, description: '상품 가격 (원)' })
  price: number;

  @ApiProperty({ example: 10, description: '재고 수량' })
  stock: number;

  @ApiProperty({ example: true, description: '할인 여부' })
  isDiscount: boolean;

  @ApiProperty({ example: new Date(), description: '상품 등록일' })
  createdAt: Date;

  @ApiProperty({
    example: false,
    description: '매진 여부 (수량이 존재해도 true로 해서 매진으로 띄우기 위함)',
  })
  isSoldOut: boolean;
}

export class MyStoreProductResponse {
  @ApiProperty({ type: MyStoreProduct, description: '스토어 등록 상품 목록', isArray: true })
  list: MyStoreProduct[];
  @ApiProperty({ example: 32, description: '스토어 등록 상품 총 수' })
  totalCount: number;
}
