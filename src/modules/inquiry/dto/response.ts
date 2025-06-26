import { Reply, User } from '@prisma/client';
import { ApiProperty, PickType } from '@nestjs/swagger';
import { AnswerStatus } from '@prisma/client';
import { UserResponse } from 'src/modules/user/dto/response';

export class InquiryReplyResponse implements Reply {
  @ApiProperty({ example: 'CUID', description: '답변 ID' })
  id: string;

  @ApiProperty({ example: 'CUID', description: '문의 ID' })
  inquiryId: string;

  @ApiProperty({ example: 'CUID', description: '작성자 ID', nullable: true })
  userId: string | null;

  @ApiProperty({ example: '이 제품은 재입고 예정입니다.', description: '답변 내용' })
  content: string;

  @ApiProperty({ example: '2024-06-01T12:00:00.000Z', description: '생성일' })
  createdAt: Date;

  @ApiProperty({ example: '2024-06-01T12:00:00.000Z', description: '수정일' })
  updatedAt: Date;

  @ApiProperty({
    type: PickType(UserResponse, ['id', 'name']),
    example: { id: 'user@codiit.com', name: '홍길동' },
    description: '유저 정보',
  })
  user: Pick<UserResponse, 'id' | 'name'>;
}

export class InquiryResponse {
  @ApiProperty({ description: '문의 ID', example: 'CUID' })
  id: string;

  @ApiProperty({ description: '상용자 ID', example: 'CUID' })
  userId: string;

  @ApiProperty({ description: '상품 ID', example: 'CUID' })
  productId: string;

  @ApiProperty({ description: '문의 제목', example: '상품 문의' })
  title: string;

  @ApiProperty({ description: '문의 내용', example: '문의 내용입니다.' })
  content: string;

  @ApiProperty({ description: '답변 상태', example: AnswerStatus.CompletedAnswer })
  status: AnswerStatus;

  @ApiProperty({ description: '비밀 급', example: false })
  isSecret: boolean;

  @ApiProperty({ description: '문의 생성 날짜', example: '2023-10-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: '문의 수정 날짜', example: '2023-10-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class inquiryReply {
  @ApiProperty({ example: 'CUID', description: '답변 ID' })
  id: string;
  @ApiProperty({ example: '이 제품은 재입고 예정입니다.', description: '답변 내용' })
  content: string;
  @ApiProperty({ example: '2024-06-01T12:00:00.000Z', description: '생성일' })
  createdAt: Date;
  @ApiProperty({ example: '2024-06-01T12:00:00.000Z', description: '수정일' })
  updatedAt: Date;
  @ApiProperty({ type: PickType(UserResponse, ['name']), description: '유저 정보' })
  user: Pick<User, 'name'>;
}
export class InquiriesResponse extends InquiryResponse {
  @ApiProperty({ type: PickType(UserResponse, ['name']), description: '유저 정보' })
  user: Pick<User, 'name'>;
  @ApiProperty({ type: inquiryReply, description: '답변 내용' })
  reply?: inquiryReply | null;
}

class InquiryStoreDto {
  @ApiProperty({ example: 'cmbt09ahe0016u4r821cfmgum' })
  id: string;

  @ApiProperty({ example: '브랜디' })
  name: string;
}

class InquiryProductDto {
  @ApiProperty({ example: 'cmbt09akw00a6u4r8wrl3htvy' })
  id: string;

  @ApiProperty({ example: '편안한 조거 팬츠' })
  name: string;

  @ApiProperty({ example: 'http://s3Url' })
  image: string;

  @ApiProperty({ type: InquiryStoreDto })
  store: InquiryStoreDto;
}

export enum InquiryStatus {
  WaitingAnswer = 'WaitingAnswer',
  CompletedAnswer = 'CompletedAnswer',
}

class InquiryItemDto {
  @ApiProperty({ example: 'cmbt09aqd00qwu4r84czhy7j9' })
  id: string;

  @ApiProperty({ example: '사이즈 추천 부탁드려요' })
  title: string;

  @ApiProperty({ example: true })
  isSecret: boolean;

  @ApiProperty({ enum: InquiryStatus, example: AnswerStatus.CompletedAnswer })
  status: InquiryStatus;

  @ApiProperty({ type: InquiryProductDto })
  product: InquiryProductDto;

  @ApiProperty({ type: PickType(UserResponse, ['id', 'name']) })
  user: Pick<UserResponse, 'id' | 'name'>;

  @ApiProperty({ example: new Date(), description: '작성일' })
  createdAt: Date;

  @ApiProperty({ example: '내용' })
  content: string;
}

export class InquiryListResponseDto {
  @ApiProperty({ type: [InquiryItemDto] })
  list: InquiryItemDto[];

  @ApiProperty({ example: 900 })
  totalCount: number;
}
