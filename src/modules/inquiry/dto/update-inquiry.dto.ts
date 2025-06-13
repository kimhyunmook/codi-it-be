import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  CreateInquiryDto,
  CreateInquiryReplyDto,
  CreateInquiryReplyServiceDto,
  CreateInquiryServiceDto,
} from './create-inquiry.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateInquiryDto extends PartialType(CreateInquiryDto) {}
export class UpdateInquiryServiceDto extends OmitType(PartialType(CreateInquiryServiceDto), [
  'productId',
]) {
  @ApiProperty({ description: '문의 ID', example: 'inquiry-CUID' })
  @IsString()
  @IsNotEmpty({ message: 'id는 필수 입니다.' })
  inquiryId: string;
}

export class UpdateInquiryReplyDto extends PartialType(CreateInquiryReplyDto) {}

export class UpdateInquiryReplyServiceDto extends OmitType(
  PartialType(CreateInquiryReplyServiceDto),
  ['inquiryId'],
) {
  @ApiProperty({})
  @IsString()
  @IsNotEmpty({})
  replyId: string;
}
