import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { AnswerStatus } from '@prisma/client';
import { IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagenation.dto';

export class FindInquiryServiceDto extends PickType(PaginationQueryDto, ['page', 'pageSize']) {
  @ApiProperty({ example: 'CUID', description: '상품 ID' })
  productId: string;
}

export class FindMyInquiriesDto extends PickType(PaginationQueryDto, ['page', 'pageSize']) {
  @ApiPropertyOptional({
    examples: {
      CompletedAnswer: { summary: '답변 완료', value: AnswerStatus.CompletedAnswer },
      WaitingAnswer: { summary: '답변 대기', value: AnswerStatus.WaitingAnswer },
    },
    description: '답변 상태',
  })
  @IsOptional()
  status?: AnswerStatus;
}
