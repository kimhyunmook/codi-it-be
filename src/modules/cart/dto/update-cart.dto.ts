import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, IsNumber } from 'class-validator';

export class UpdateCartDto {
  @ApiProperty({ description: '상품 ID', example: 'product3' })
  @IsString()
  productId: string;

  @ApiProperty({ description: ' 사이즈 Id', example: '3' })
  @IsNumber()
  sizeId: number;

  @ApiProperty({ description: '수량(1 이상)', example: 2, minimum: 1 })
  @IsInt()
  @Min(1, { message: '수량은 1 이상이어야 합니다.' })
  quantity: number;
}
