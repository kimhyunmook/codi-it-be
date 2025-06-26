// dto/update-cart-by-sizes.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsNumber, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SizeQuantityDto {
  @ApiProperty({ example: 1, description: '사이즈 ID' })
  @IsNumber()
  sizeId: number;

  @ApiProperty({ example: 3, description: '수량 (1 이상)' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdateCartBySizesDto {
  @ApiProperty({ example: 'product1', description: '상품 ID (문자열 형태)' })
  @IsString()
  productId: string;

  @ApiProperty({
    type: [SizeQuantityDto],
    description: '상품별 사이즈와 수량 리스트',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeQuantityDto)
  sizes: SizeQuantityDto[];
}
