import { ApiProperty } from '@nestjs/swagger';
import { ProductErrorMsg } from '../constants/message';

export class ProductBadRequestDto {
  @ApiProperty({ example: 400 })
  statusCode: number;
  @ApiProperty({ example: '잘못된 요청입니다.' })
  message: string;
  @ApiProperty({ example: 'Bad Request' })
  error: string;
}

export class ProductNotFoundDto {
  @ApiProperty({ example: 404 })
  statusCode: number;
  @ApiProperty({ example: ProductErrorMsg.NotFound })
  message: string;
  @ApiProperty({ example: 'Not Found' })
  error: string;
}
export class ProductForbiddenDto {
  @ApiProperty({ example: 403 })
  statusCode: number;
  @ApiProperty({ example: ProductErrorMsg.Forbidden })
  message: string;
  @ApiProperty({ example: 'Forbidden' })
  error: string;
}

export class CategoryNotFoundDto {
  @ApiProperty({ example: 404 })
  statusCode: number;
  @ApiProperty({ example: ProductErrorMsg.NotCategory })
  message: string;
  @ApiProperty({ example: 'Not Found' })
  error: string;
}
