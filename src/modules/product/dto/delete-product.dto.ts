import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteProductDto {
  @ApiProperty({ example: 'CUID', description: '상품 ID' })
  @IsString()
  @IsNotEmpty({ message: 'productId는 필수 값입니다.' })
  productId: string;
}
