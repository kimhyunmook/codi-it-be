import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { ProductReviewController } from './product-reviews.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ReviewController, ProductReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
