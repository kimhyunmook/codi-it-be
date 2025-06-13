import {
  Controller,
  Body,
  Post,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import { InquiryService } from './inquiry.service';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UpdateInquiryDto, UpdateInquiryReplyDto } from './dto/update-inquiry.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { InquiriesErrorMsg } from './constants/message';
import { NotFoundInquiryDto } from './dto/error-inquiry.dto';
import { CreateInquiryReplyDto } from './dto/create-inquiry.dto';
import { InquiryReplyResponse, InquiriesResponse, InquiryListResponseDto } from './dto/response';
import { InquiryResponse } from './dto/response';
import { UserId } from 'src/types/common';
import { FindMyInquiriesDto } from './dto/find-inquiry.dto';

const paramId = 'inquiryId';
const replyId = 'replyId';

@ApiTags('Inquiry')
@Controller('inquiries')
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '내 문의 조회 (판매자,구매자 공용)',
    description: '내 문의 리스트 조회',
  })
  @ApiOkResponse({
    type: InquiryListResponseDto,
    description: '내 문의 리스트 조회 성공',
  })
  private async findMyInquiries(
    @Query() dto: FindMyInquiriesDto,
    @CurrentUser('sub') userId: UserId['userId'],
  ) {
    return this.inquiryService.myInquiries(dto, userId);
  }

  @Get(`:${paramId}`)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '문의 상세 조회', description: '문의 상세정보 조회했습니다.' })
  @ApiOkResponse({ type: InquiriesResponse, description: '문의 상세 조회 성공' })
  @ApiNotFoundResponse({ type: NotFoundInquiryDto, description: InquiriesErrorMsg.NotFound })
  async findOneInquiry(@Param(paramId) inquiryId: string): Promise<InquiryResponse> {
    return this.inquiryService.findOne(inquiryId);
  }

  @Get(`:${replyId}/replies`)
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '문의 답변 상세 조회',
    description: '문의 답변 상세 정보를 정회했습니다.',
  })
  @ApiOkResponse({ type: InquiriesResponse, description: '문의 답변 상세 조회 성공' })
  async findOneReply(@Param(replyId) replyId: string) {
    return this.inquiryService.findOneReply(replyId);
  }

  @Post(`:${paramId}/replies`)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '문의 답변',
    description: '문의 답변 생성입니다.',
  })
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: InquiryReplyResponse, description: '문의 답변 생성 성공' })
  async replyCreate(
    @Param(paramId) inquiryId: string,
    @Body() dto: CreateInquiryReplyDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.inquiryService.replyCreate({ ...dto, userId, inquiryId });
  }

  @Patch(`:${paramId}`)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '문의 수정', description: '문의를 수정 입니다.' })
  @ApiOkResponse({ type: InquiryResponse, description: '문의 수정 성공' })
  async updateInquiry(
    @Param(paramId) inquiryId: string,
    @Body() dto: UpdateInquiryDto,
    @CurrentUser('sub') userId: string,
  ): Promise<InquiryResponse> {
    return this.inquiryService.update({ ...dto, userId, inquiryId });
  }

  @Patch(`:${replyId}/replies`)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '문의 답변 수정', description: '문의 답변을 수정입니다.' })
  @ApiOkResponse({ type: InquiryReplyResponse, description: '문의 답변 수정 성공' })
  async replyUpdate(
    @Param(replyId) replyId: string,
    @Body() dto: UpdateInquiryReplyDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.inquiryService.replyUpdate({ ...dto, userId, replyId });
  }

  @Delete(`:${paramId}`)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '문의 삭제', description: '문의를 삭제 했습니다.' })
  @ApiOkResponse({ type: InquiryResponse, description: '문의 삭제 성공' })
  async deleteInquiry(@Param(paramId) inquiryId: string): Promise<InquiryResponse> {
    return this.inquiryService.deleteInquiry(inquiryId);
  }
}
