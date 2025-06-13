import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteCartItemDto {
  @ApiProperty({ description: '삭제할 장바구니 아이템 ID' })
  @IsString()
  cartItemId: string;
}
