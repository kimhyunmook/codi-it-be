import { IsOptional, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SortOption {
  MOST_REVIEWED = 'mostReviewed', // 리뷰 많은 순
  RECENT = 'recent', // 등록일 순
  LOW_PRICE = 'lowPrice', // 가격 낮은 순
  HIGH_PRICE = 'highPrice', // 가격 높은 순
  HIGH_RATING = 'highRating', // 별점 높은 순
  SALES_RANKING = 'salesRanking', // 판매순
}

export class PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: '페이지 번호' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 16, description: '페이지 리스트 갯수' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 16;

  @ApiPropertyOptional({ example: '가디건', description: '검색할 단어' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: SortOption,
    description: '정렬 옵션',
    examples: {
      mostReviewed: { summary: '리뷰 많은 순', value: SortOption.MOST_REVIEWED },
      recent: { summary: '등록일 순', value: SortOption.RECENT },
      lowPrice: { summary: '가격 낮은 순', value: SortOption.LOW_PRICE },
      highPrice: { summary: '가격 높은 순', value: SortOption.HIGH_PRICE },
      highRating: { summary: '별점 높은 순', value: SortOption.HIGH_RATING },
      salesRanking: { summary: '판매 순', value: SortOption.SALES_RANKING },
    },
  })
  @IsOptional()
  @IsEnum(SortOption)
  sort?: SortOption;
}
