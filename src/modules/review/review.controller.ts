import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { UpdateReviewDto } from './dto/update-review.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { SwaggerErrorExamples } from 'src/common/utils/swagger-error-response.util';
import { ReviewResponseDto } from './dto/review-response.dto';

@ApiTags('review')
@ApiBearerAuth()
@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(AuthGuard)
  @Patch(':reviewId')
  @ApiOperation({ summary: '리뷰 수정(리뷰ID)' })
  @ApiParam({ name: 'reviewId', description: '수정할 리뷰 ID', example: 'review1' })
  @ApiResponse({
    status: 201,
    description: '리뷰를 수정했습니다.',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '리뷰를 찾을 수 없습니다',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  @ApiResponse({
    status: 401,
    description: '사용자를 찾을 수 없습니다',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiBody({ type: UpdateReviewDto })
  async updateReview(@Param('reviewId') reviewId: string, @Body() dto: UpdateReviewDto) {
    return this.reviewService.updateReview(reviewId, dto);
  }

  @UseGuards(AuthGuard)
  @Delete(':reviewId')
  @ApiOperation({ summary: '리뷰 삭제(리뷰Id)' })
  @ApiResponse({
    status: 200,
    description: '리뷰를 삭제 했습니다',
  })
  @ApiResponse({
    status: 404,
    description: '리뷰를 찾지 못했습니다',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  @ApiResponse({
    status: 401,
    description: '사용자를 찾지 못했습니다',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiParam({ name: 'reviewId', description: '삭제할 리뷰 ID', example: 'review1' })
  async deleteReview(@Param('reviewId') reviewId: string, @CurrentUser('sub') userId: string) {
    if (!userId) throw new ForbiddenException('사용자 인증 정보가 없습니다.');
    return this.reviewService.deleteReview(reviewId, userId);
  }

  @UseGuards(AuthGuard)
  @Get(':reviewId')
  @ApiOperation({ summary: '리뷰 상세 조회(리뷰Id)' })
  @ApiParam({
    name: 'reviewId',
    required: true,
    description: '조회할 리뷰 ID',
    example: 'review1',
  })
  @ApiResponse({
    status: 200,
    description: '리뷰 상세 정보 조회에 성공했습니다.',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증에 실패했습니다.',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiResponse({
    status: 404,
    description: '리뷰를 찾을 수 없습니다.',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  async getReviewById(@Param('reviewId') reviewId: string) {
    return this.reviewService.getReviewDetail(reviewId);
  }
}
