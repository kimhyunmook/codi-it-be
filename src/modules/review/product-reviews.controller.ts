import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { ReviewResponseDto } from './dto/review-response.dto';
import { SwaggerErrorExamples } from 'src/common/utils/swagger-error-response.util';

@ApiTags('review')
@ApiBearerAuth()
@Controller('product/:productId/reviews')
export class ProductReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiOperation({ summary: '상품 리뷰 작성(ProductID)' })
  @ApiResponse({
    status: 201,
    description: '리뷰를 작성했습니다',
    type: ReviewResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '상품을 찾지 못했습니다',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  @ApiResponse({
    status: 401,
    description: '사용자를 찾지 못했습니다',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  createReview(
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.reviewService.createReview(userId, productId, dto);
  }

  @Get()
  @ApiOperation({ summary: '상품 리뷰 목록 조회(페이지네이션 포함/ProducId)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiOkResponse({ type: [ReviewResponseDto] })
  @ApiResponse({
    status: 404,
    description: '리뷰를 찾지 못했습니다',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  @ApiResponse({
    status: 401,
    description: '사용자를 찾지 못했습니다.',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  getProductReviews(@Param('productId') productId: string) {
    return this.reviewService.getReviewsByProduct(productId);
  }
}
