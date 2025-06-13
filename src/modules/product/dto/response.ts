import { ApiProperty, OmitType } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { CreatedAtDto } from 'src/common/dto/date.dto';
import { InquiryReplyResponse, InquiryResponse } from 'src/modules/inquiry/dto/response';

export class CategoryNameDto {
  @ApiProperty({ example: 'CUID', description: '카테고리 ID' })
  id: string;
  @ApiProperty({
    example: 'bottom',
    description: '카테고리 이름 리스트 (JSON 배열)',
  })
  name: string;
}

export class ReviewDto extends CreatedAtDto {
  @ApiProperty({ example: '좋은 제품입니다!', description: '리뷰 내용' })
  content: string;

  @ApiProperty({ example: 5, description: '별점' })
  rating: number;

  @ApiProperty({
    example: { id: 'user-cuid', username: 'johndoe' },
    description: '작성자 정보',
    required: false,
  })
  user?: User;
}

export class StocksDto {
  @ApiProperty({ example: 'CUID', description: '재고 ID' })
  id: string;
  @ApiProperty({ example: 'CUID', description: '상품 ID' })
  productId: string;
  @ApiProperty({ example: 'CUID', description: '사이즈 ID' })
  sizeId: number;
  @ApiProperty({ example: 3, description: '상품 수량' })
  quantity: number;
}

export class ProductResponse {
  @ApiProperty({ example: 'CUID', description: '상품 ID' })
  id: string;

  @ApiProperty({ example: 'CUID', description: '스토어 ID' })
  storeId: string;

  @ApiProperty({ example: '가디건', description: '상품 이름' })
  name: string;

  @ApiProperty({ example: 20000, description: '정가' })
  price: number;

  @ApiProperty({ example: 'https://s3-URL', description: '상품 이미지 URL' })
  image: string;

  @ApiProperty({ example: 10, description: '할인율(%)' })
  discountRate: number;

  @ApiProperty({
    example: '2025-05-28T12:34:56Z',
    description: '할인 시작 날짜 (nullable)',
    required: false,
  })
  discountStartTime: Date | null;

  @ApiProperty({
    example: '2025-05-30T12:34:56Z',
    description: '할인 종료 날짜 (nullable)',
    required: false,
  })
  discountEndTime: Date | null;

  @ApiProperty({
    type: [CategoryNameDto],
    description: '카테고리 정보 (복수)',
    required: false,
  })
  category?: CategoryNameDto[];

  @ApiProperty({
    type: [ReviewDto],
    description: '상품에 대한 리뷰 리스트',
    required: false,
  })
  reviews?: ReviewDto[];

  @ApiProperty({ example: '2025-06-01T00:00:00Z', description: '생성일' })
  createdAt: Date;

  @ApiProperty({ example: '2025-06-02T00:00:00Z', description: '수정일' })
  updatedAt: Date;

  @ApiProperty({ type: [StocksDto], description: '사이즈 별 상품 수량' })
  stocks?: StocksDto[];
}

export class ProductListDto {
  @ApiProperty({ example: 'CUID', description: '상품 ID' })
  id: string;

  @ApiProperty({ example: 'CUID', description: '스토어 ID' })
  storeId: string;

  @ApiProperty({ example: '무신사', description: '스토어 이름' })
  storeName: string;

  @ApiProperty({ example: '가디건', description: '상품 이름' })
  name: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: '상품 이미지 URL' })
  image: string;

  @ApiProperty({ example: 20000, description: '가격' })
  price: number;

  @ApiProperty({ example: 18000, description: '할인 가격' })
  discountPrice: number;

  @ApiProperty({ example: 10, description: '할인율(%)' })
  discountRate: number;

  @ApiProperty({
    example: '2025-06-01T00:00:00Z',
    description: '할인 시작 시간 (nullable)',
    required: false,
  })
  discountStartTime: Date | null;

  @ApiProperty({
    example: '2025-06-10T00:00:00Z',
    description: '할인 종료 시간 (nullable)',
    required: false,
  })
  discountEndTime: Date | null;

  @ApiProperty({ example: 5, description: '리뷰 수' })
  reviewsCount: number;

  @ApiProperty({ example: 4.5, description: '리뷰 평균 평점' })
  reviewsRating: number;

  @ApiProperty({
    example: '2025-06-01T12:00:00Z',
    description: '상품 생성일',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-06-02T12:00:00Z',
    description: '상품 수정일',
  })
  updatedAt: Date;

  @ApiProperty({ example: 30, description: '판매 수', type: Number })
  sales: number;
}

export class ProductListResponse {
  @ApiProperty({
    type: ProductListDto,
    description: '상품 목록',
    isArray: true,
    required: true,
  })
  list: ProductListDto[];
  @ApiProperty({ example: 340, description: '상품 총 갯수' })
  totalCount: number;
}

class ReplyUser {
  @ApiProperty({ example: 'abc123', description: '유저 ID' })
  id: string;

  @ApiProperty({ example: '홍길동', description: '유저 이름' })
  name: string;
}

export class DetailInquiryReply extends OmitType(InquiryReplyResponse, [
  'inquiryId',
  'userId',
  'user',
]) {
  @ApiProperty({ type: () => ReplyUser, nullable: true, description: '답변 작성자 (nullable)' })
  user?: ReplyUser | null;
}

export class DetailInquiry extends OmitType(InquiryResponse, ['userId', 'productId'] as const) {
  @ApiProperty({
    type: () => DetailInquiryReply,
    required: false,
    nullable: true,
    description: '답변 내용 (nullable)',
  })
  reply?: DetailInquiryReply | null;
}

export class DetailProductResponse {
  @ApiProperty({ example: 'CUID', description: '상품 ID' })
  id: string;

  @ApiProperty({ example: '가디건', description: '상품 이름' })
  name: string;

  @ApiProperty({ example: 'https://s3-URL', description: '상품 이미지 URL' })
  image: string;

  @ApiProperty({ example: '2025-06-01T00:00:00Z', description: '생성일' })
  createdAt: Date;

  @ApiProperty({ example: '2025-06-02T00:00:00Z', description: '수정일' })
  updatedAt: Date;

  @ApiProperty({ example: 4.5, description: '평균 리뷰 평점' })
  reviewsRating: number;

  @ApiProperty({ example: 'CUID', description: '스토어 ID' })
  storeId: string;

  @ApiProperty({ example: '하이버', description: '스토어 이름' })
  storeName: string;

  @ApiProperty({ example: 20000, description: '정가' })
  price: number;

  @ApiProperty({ example: 18000, description: '할인가' })
  discountPrice: number;

  @ApiProperty({ example: 10, description: '할인율(%)' })
  discountRate: number;

  @ApiProperty({
    example: '2025-05-28T12:34:56Z',
    required: false,
    nullable: true,
    description: '할인 시작 날짜 (nullable)',
  })
  discountStartTime?: Date | null;

  @ApiProperty({
    example: '2025-05-30T12:34:56Z',
    required: false,
    nullable: true,
    description: '할인 종료 날짜 (nullable)',
  })
  discountEndTime?: Date | null;

  @ApiProperty({ example: 32, description: '리뷰 수' })
  reviewsCount?: number;

  @ApiProperty({ type: () => ReviewDto, isArray: true, description: '상품에 대한 리뷰 리스트' })
  reviews?: ReviewDto[];

  @ApiProperty({ type: () => DetailInquiry, isArray: true, description: '상품 문의' })
  inquiries: DetailInquiry[];

  @ApiProperty({ type: () => CategoryNameDto, isArray: true, description: '카테고리 정보 (복수)' })
  category: CategoryNameDto;

  @ApiProperty({ type: () => StocksDto, isArray: true, description: '사이즈 별 상품 수량' })
  stocks: Omit<StocksDto, 'productId' | 'sizeId'>[];
}
