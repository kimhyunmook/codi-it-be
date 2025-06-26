import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { StocksDto } from './create-product.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateProductDto extends PartialType(OmitType(CreateProductDto, ['stocks'])) {
  @ApiProperty({ example: 'CUID', description: '상품 ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({ example: 'false', description: '매진 여부' })
  @IsOptional()
  @IsString()
  isSoldOut: string;

  @ApiProperty({ type: StocksDto, description: '사이즈 별 재고', isArray: true })
  // @Transform(({ value }) => {
  //   try {
  //     const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  //     if (!Array.isArray(parsed)) throw new Error();
  //     return parsed.map((item) => plainToInstance(StocksDto, item));
  //   } catch (e: any) {
  //     throw new BadRequestException('stocks 필드의 JSON 형식이 잘못되었습니다.', e.message);
  //   }
  // })
  // @IsArray()
  // @ValidateNested({ each: true })
  // @Type(() => StocksDto)
  @IsString()
  // stocks: StocksDto[];
  stocks: string;
}
