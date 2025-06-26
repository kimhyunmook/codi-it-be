import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ description: '이름', example: 'my Store' })
  @IsString()
  name: string;

  @ApiProperty({ description: '주소', example: '경기도 부천시 상동......' })
  @IsString()
  address: string;

  @ApiProperty({ description: '상세 주소', example: '105동 306호' })
  @IsString()
  detailAddress: string;

  @ApiProperty({ description: '전화번호', example: '010-0000-0000' })
  // @IsPhoneNumber('KR') // 추후 추가
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: '내용',
    example: '저희는 트렌드에 맞춘 옷, 악세사리를 취급하고 있습니다.',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '이미지 URL 또는 경로', example: 'image File' })
  @IsOptional()
  image?: string;
}
