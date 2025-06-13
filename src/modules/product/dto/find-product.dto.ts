import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagenation.dto';

export class FindListProductDto extends PaginationQueryDto {
  @ApiProperty({
    example: 0,
    description: '가격 조회 (price 값 min)',
    default: undefined,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  priceMin?: number;

  @ApiProperty({
    example: 20000,
    default: undefined,
    description: '가격 조회 (price 값 max)',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  priceMax?: number;

  @ApiProperty({ example: 'L', description: '사이즈 이름', required: false })
  @IsOptional()
  @Type(() => String)
  size?: string;

  @ApiProperty({ example: 'CUID', description: '스토어 ID', required: false })
  @IsOptional()
  @Type(() => String)
  favoriteStore?: string;

  @ApiProperty({ example: 'bottom', description: '카테고리 이름', required: false })
  @IsOptional()
  @Type(() => String)
  categoryName?: string;
}

export class FindProductDto {
  @ApiProperty({ example: 'CUID', description: '상품 ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;
}
