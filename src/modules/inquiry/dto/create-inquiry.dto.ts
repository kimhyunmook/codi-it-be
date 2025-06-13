import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInquiryServiceDto {
  @ApiProperty({ description: '상품 ID', example: 'product-CUID' })
  @IsString()
  @IsNotEmpty({ message: 'productId는 필수 입니다.' })
  productId: string;

  @ApiProperty({ description: '문의 제목', example: ' 상품 문의합니다.' })
  @IsString()
  @IsNotEmpty({ message: 'title은 필수 입니다.' })
  title: string;

  @ApiProperty({ description: '문의 내용', example: '문의 내용입니다.' })
  @IsString()
  @IsNotEmpty({ message: 'content는 필수 입니다.' })
  content: string;

  @ApiPropertyOptional({ description: '비밀 글', example: false })
  @IsOptional()
  @IsBoolean()
  isSecret?: boolean;
}

export class CreateInquiryDto extends OmitType(CreateInquiryServiceDto, ['productId']) {}

export class CreateInquiryReplyServiceDto {
  @ApiProperty({ description: 'user ID', example: 'user-CUID' })
  @IsString()
  @IsNotEmpty({ message: 'userId는 필수 입니다.' })
  userId: string | null;

  @ApiProperty({ description: '문의 ID', example: 'inquiry-CUID' })
  @IsString()
  @IsNotEmpty({ message: 'inquiryId는 필수 입니다.' })
  inquiryId: string;

  @ApiProperty({ description: '답변 내용', example: '답변 내용입니다.' })
  @IsString()
  @IsNotEmpty({ message: 'content는 필수 입니다.' })
  content: string;
}

export class CreateInquiryReplyDto extends OmitType(CreateInquiryReplyServiceDto, [
  'userId',
  'inquiryId',
]) {}
