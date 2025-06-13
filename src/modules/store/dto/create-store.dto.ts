import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ description: '이름', example: 'my Store' })
  @IsString()
  @IsNotEmpty({ message: 'name은 필수 값입니다.' })
  name: string;

  @ApiProperty({ description: '주소', example: '경기도 부천시 상동' })
  @IsString()
  @IsNotEmpty({ message: 'address는 필수 값 입니다.' })
  address: string;

  @ApiProperty({ description: '전화번호', example: '010-3333-4444' })
  @IsString()
  @IsNotEmpty({ message: 'phoneNumber는 필수 값 입니다.' })
  phoneNumber: string;

  @ApiProperty({
    description: '내용',
    example: '저희는 트렌드에 맞춘 옷, 악세사리를 취급하고 있습니다.',
  })
  @IsString()
  @IsNotEmpty({ message: 'content는 필수 값 입니다.' })
  content: string;

  @ApiPropertyOptional({ description: '이미지 URL 또는 경로', example: 'https://S3-URL' })
  @IsOptional()
  image?: string;
}
