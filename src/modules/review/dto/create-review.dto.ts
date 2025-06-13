import { Min, Max, Length, IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5, description: '별점 (1~5)' })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: '이 상품 정말 좋아요!', minLength: 10, description: '리뷰 내용' })
  @IsString()
  @Length(10)
  content: string;

  @IsString()
  @IsNotEmpty()
  orderItemId: string; // ✅ 추가
}
