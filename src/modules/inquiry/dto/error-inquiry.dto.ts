import { ApiProperty } from '@nestjs/swagger';
import { InquiriesErrorMsg } from '../constants/message';

export class NotFoundInquiryDto {
  @ApiProperty({ example: InquiriesErrorMsg.NotFound })
  message: string;
  @ApiProperty({ example: 404 })
  statusCode: number;
  @ApiProperty({ example: 'Not Found' })
  error: string;
}
