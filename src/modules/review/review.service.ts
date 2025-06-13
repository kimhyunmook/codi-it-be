import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {} // PrismaService는 Prisma Client를 래핑한 서비스입니다.

  async createReview(userId: string, productId: string, dto: CreateReviewDto) {
    try {
      const orderItem = await this.prisma.orderItem.findFirst({
        where: {
          id: dto.orderItemId,
          order: {
            userId,
          },
          productId,
          isReviewed: false,
        },
      });

      if (!orderItem) {
        throw new ForbiddenException(
          '구매한 상품 중 아직 리뷰를 작성하지 않은 주문 항목이어야 합니다.',
        );
      }

      const reviewData = {
        userId,
        productId,
        orderItemId: dto.orderItemId,
        rating: dto.rating,
        content: dto.content,
      };
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: {
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });
      let reviewsRating = 0;
      if (product && product.reviews.length !== 0)
        reviewsRating = product.reviews.reduce((a, c) => a + c.rating, 0) / product.reviews.length;

      const [createdReview] = await this.prisma.$transaction([
        this.prisma.review.create({
          data: reviewData,
        }),
        this.prisma.orderItem.update({
          where: { id: dto.orderItemId },
          data: { isReviewed: true },
        }),
        this.prisma.product.update({
          where: { id: productId },
          data: { reviewsRating },
        }),
      ]);

      return createdReview;
    } catch (error) {
      console.error('리뷰 작성 중 오류:', error);
      throw new InternalServerErrorException('리뷰 작성 중 오류가 발생했습니다.');
    }
  }

  async getReviewsByProduct(productId: string, page: number = 1, limit: number = 5) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    const [total, reviews] = await this.prisma.$transaction([
      this.prisma.review.count({
        where: { productId },
      }),
      this.prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      items: reviews,
      meta: {
        total,
        page,
        limit,
        hasNextPage: page * limit < total,
      },
    };
  }

  async updateReview(reviewId: string, dto: UpdateReviewDto) {
    const existing = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existing) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    if (dto.rating === undefined && dto.content === undefined) {
      throw new ForbiddenException('수정할 내용이 없습니다.');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating !== undefined && { rating: dto.rating }),
        ...(dto.content !== undefined && { content: dto.content }),
      },
    });

    return updated;
  }

  async deleteReview(reviewId: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    if (review.userId !== userId) {
      throw new ForbiddenException('본인이 작성한 리뷰만 삭제할 수 있습니다.');
    }

    return this.prisma.review.delete({
      where: { id: reviewId },
    });
  }

  async getReviewDetail(reviewId: string) {
    // 1. 리뷰 정보와 관련된 유저, 상품 조회
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: true, // 구매자 이름 조회용
        product: true, // 상품명 조회용
      },
    });

    if (!review) throw new NotFoundException('리뷰를 찾을 수 없습니다.');

    // 2. 리뷰 작성자가 구매한 가장 최신 주문 상품 정보 조회
    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        productId: review.productId,
        order: {
          userId: review.userId,
        },
      },
      include: {
        order: true, // 주문 정보 포함 (구매일 등)
        size: true, // 상품 사이즈 포함
      },
      orderBy: {
        order: { createdAt: 'desc' }, // 가장 최근 구매 기준
      },
    });

    if (!orderItem) throw new NotFoundException('구매 내역을 찾을 수 없습니다.');

    // 3. 응답 데이터 반환
    return {
      reviewId: review.id,
      productName: review.product.name,
      size: orderItem.size.size, // 사이즈 JSON 데이터 (필요시 가공)
      price: orderItem.price,
      quantity: orderItem.quantity,
      rating: review.rating,
      content: review.content,
      reviewer: review.user.name,
      reviewCreatedAt: review.createdAt,
      purchasedAt: orderItem.order.createdAt,
    };
  }
}
