import { ApiProperty } from '@nestjs/swagger';
import { User, UserType } from '@prisma/client';
import { GradeResponse } from 'src/modules/metadata/dto/response';
import { StoreResponse } from 'src/modules/store/dto/response.dto';

export class LikesStoreResponse {
  @ApiProperty({ example: 'CUID', description: '스토어 ID' })
  storeId?: string;
  @ApiProperty({ example: 'CUID', description: '유저 ID' })
  userId?: string;
  @ApiProperty({ description: '가게 정보', type: StoreResponse })
  store: StoreResponse;
}

export class UserResponse implements Omit<User, 'gradeId'> {
  @ApiProperty({ description: '유저 KEY ID', example: 'CUID' })
  id: string;

  @ApiProperty({ description: '유저 이름', example: '김유저' })
  name: string;

  @ApiProperty({ description: '유저 이메일', example: 'email@example.com' })
  email: string;

  @ApiProperty({ description: '유저 비밀번호 (hash)', example: '$2b$10$abc...' })
  password: string;

  @ApiProperty({ description: '유저 타입', enum: UserType, example: UserType.BUYER })
  type: UserType;

  @ApiProperty({ description: '유저 포인트', example: 999 })
  points: number;

  @ApiProperty({ description: '유저 생성일', example: '2025-05-29T06:00:41.976Z' })
  createdAt: Date;

  @ApiProperty({ description: '유저 정보 업데이트일', example: '2025-05-29T06:00:41.976Z' })
  updatedAt: Date;

  @ApiProperty({ description: '유저 refreshToken', example: 'refresh token' })
  refreshToken: string | null;

  @ApiProperty({
    description: '등급 정보 (nullable)',
    type: GradeResponse,
    required: false,
    example: {
      id: 'grade_green',
      name: '그린',
      rate: 10,
      minAmount: 50000,
    },
  })
  grade?: GradeResponse | null;

  @ApiProperty({
    example:
      'https://sprint-be-project.s3.ap-northeast-2.amazonaws.com/codiit/1749477485230-user_default.png',
    description:
      '기본 값 : https://sprint-be-project.s3.ap-northeast-2.amazonaws.com/codiit/1749477485230-user_default.png',
  })
  image: string | null;
}
