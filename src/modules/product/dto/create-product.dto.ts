import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { BadRequestException } from '@nestjs/common';

export class CategoryName {
  @ApiProperty({ example: '가디건' })
  ko: string;
  @ApiProperty({ example: 'cadigun' })
  en: string;
}

export class StocksDto {
  @ApiProperty({ example: 1, description: '사이즈 ID' })
  @IsInt()
  @Type(() => Number)
  sizeId: number;

  @ApiProperty({ example: 3, description: '재고 수량' })
  @IsInt()
  @Max(999, { message: '수량은 999이하로 설정해주세요.' })
  @Min(0, { message: '수량은 0이상으로 설정해주세요' })
  @Type(() => Number)
  quantity: number;
}

export class CreateProductDto {
  @ApiProperty({ example: '가디건', description: '상품 이름' })
  @IsString()
  @IsNotEmpty({ message: 'name은 필수 값입니다.' })
  name: string;

  @ApiProperty({ example: 20000, description: '정가' })
  @Type(() => Number)
  @IsInt()
  @Max(100000000, { message: '가격은 1억이하만 가능합니다.' })
  @Min(0, { message: '가격은 0이상만 가능합니다.' })
  @IsNotEmpty({ message: 'price 필수 값입니다.' })
  price: number;

  @ApiPropertyOptional({ example: '제품 상세 정보', description: '제품 상세 정보' })
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'image file', description: 'image url' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ example: 10, description: '할인율', required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  discountRate?: number;

  @ApiPropertyOptional({ description: '할인 시작 날짜' })
  @IsString()
  @IsOptional()
  discountStartTime?: string;

  @ApiPropertyOptional({ description: '할인 종료 날짜' })
  @IsString()
  @IsOptional()
  discountEndTime?: string;

  @ApiProperty({ type: String, example: 'top', description: '카테고리 이름' })
  @IsString()
  categoryName: string;

  @ApiProperty({ type: StocksDto, description: '사이즈 별 재고', isArray: true })
  @Transform(({ value }) => {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      if (!Array.isArray(parsed)) throw new Error();
      // 요소 하나하나를 StocksDto로 변환
      return parsed.map((item) => plainToInstance(StocksDto, item));
    } catch (e: any) {
      throw new BadRequestException('stocks 필드의 JSON 형식이 잘못되었습니다.', e);
    }
  })
  @IsArray({ message: 'Array입니다.' })
  @ValidateNested({ each: true })
  @Type(() => StocksDto)
  stocks: StocksDto[];
}
