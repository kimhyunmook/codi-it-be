import { IsString, IsPhoneNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateOrderDto } from './create-order.dto'; // 기존 생성 DTO 참고

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @ApiProperty({ example: '구매자', description: '구매자 이름', required: false })
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ example: '010-1234-5789', description: '구매자 연락처', required: false })
  @IsPhoneNumber('KR')
  phone?: string;

  @ApiProperty({ example: '서울특별시 강남구', description: '배송지 주소', required: false })
  @IsString()
  @IsNotEmpty()
  address?: string;
}
