import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Min, Max, IsString, MinLength, IsNumber } from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({ example: 4.5, minimum: 1, maximum: 5, description: '별점 (1~5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MinLength(10)
  content?: string;
}
