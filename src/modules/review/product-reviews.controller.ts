import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
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
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('review')
@Controller('product/:productId/reviews')
export class ProductReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: '상품 리뷰 작성(ProductID)',
    description: '상품 ID를 사용하여 리뷰를 작성합니다.',
  })
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

  @Public()
  @Get()
  @ApiOperation({
    summary: '상품 리뷰 목록 조회(페이지네이션 포함/ProducId)',
    description: '상품 ID를 사용하여 해당 상품의 리뷰 목록을 페이지네이션과 함께 조회합니다.',
  })
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
  getProductReviews(
    @Param('productId') productId: string,
    @Query('page', new ParseIntPipe()) page = 1,
    @Query('limit', new ParseIntPipe()) limit = 5,
  ) {
    return this.reviewService.getReviewsByProduct(productId, page, limit);
  }
}
