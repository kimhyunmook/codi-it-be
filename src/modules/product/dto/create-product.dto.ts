import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CategoryName {
  @ApiProperty({ example: '가디건' })
  ko: string;
  @ApiProperty({ example: 'cadigun' })
  en: string;
}

// export class Category {
//   @ApiProperty({ example: 1, description: '카테고리 ID' })
//   id: number;
//   @ApiProperty({ type: CategoryName, description: '카테고리 name' })
//   name: JSON;
// }

export class StocksDto {
  @ApiProperty({ example: 1, description: '사이즈 ID' })
  sizeId: number;
  @ApiProperty({ example: 3, description: '재고 수량' })
  quantity: number;
}

export class CreateProductDto {
  @ApiProperty({ example: '가디건', description: '상품 이름' })
  @IsString()
  @IsNotEmpty({ message: 'name은 필수 값입니다.' })
  name: string;

  @ApiProperty({ example: 20000, description: '정가' })
  @IsNumber()
  @IsNotEmpty({ message: 'price 필수 값입니다.' })
  price: number;

  @ApiPropertyOptional({ example: 'image file', description: 'image url' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ example: 10, description: '할인율', required: false })
  @IsNumber()
  @IsOptional()
  discountRate?: number;

  @ApiPropertyOptional({ type: Date, example: new Date(), description: '할인 시작 날짜' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  discountStartTime?: Date;

  @ApiPropertyOptional({ type: Date, example: new Date(), description: '할인 종료 날짜' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  discountEndTime?: Date;

  @ApiProperty({ type: String, example: ['top'], description: '카테고리 이름' })
  @IsString()
  @Type(() => String)
  categoryName: string;

  @ApiProperty({ type: StocksDto, description: '사이즈 별 재고', isArray: true })
  @IsArray({ message: 'Array입니다.' })
  stocks: StocksDto[];
}
