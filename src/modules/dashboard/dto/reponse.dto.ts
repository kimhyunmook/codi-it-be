import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class SalesLog {
  @ApiProperty({ example: 38, description: '주문 상품 수' })
  totalOrders: number;
  @ApiProperty({ example: 15000000, description: '총 주문 판매 금액' })
  totalSales: number;
}

export class SaleLogChangeRate implements SalesLog {
  @ApiProperty({ example: 23, description: '주문 상품 수 (%)' })
  totalOrders: number;
  @ApiProperty({ example: 20, description: '총 주문 판매 금액 (%)' })
  totalSales: number;
}

export class SummarySalesLog {
  @ApiProperty({ example: SalesLog, description: '현재' })
  current: SalesLog;
  @ApiProperty({ example: SalesLog, description: '이전' })
  previous: SalesLog;
  @ApiProperty({ example: SaleLogChangeRate, description: '변동률 (%)' })
  changeRate: SaleLogChangeRate;
}

export class ProductInfo {
  @ApiProperty({ example: 'product-cuid', description: '상품 ID' })
  id: string;
  @ApiProperty({ example: '스웨터', description: '상품이름' })
  name: string;
  @ApiProperty({ example: 30000, description: '상품 가격' })
  price: number;
}

export class TopSales {
  @ApiProperty({ example: 215, description: '상품 주문 수' })
  totalOrders: number;
  @ApiProperty({ example: ProductInfo, description: '상품 정보' })
  product: ProductInfo;
}

export class PriceRangeDto {
  @ApiProperty({ example: '만원 이하', description: '가격대' })
  priceRange: string;
  @ApiProperty({ example: 3505000, description: '가격대의 총 판매 금액' })
  totalSales: number;
  @ApiProperty({ example: 35.6, description: '해당 가격대의 판매 비율' })
  percentage: number;
}

export class FindDashboardResponseDto {
  @ApiProperty({ example: SummarySalesLog, description: '오늘 판매 관련' })
  today: SummarySalesLog;
  @ApiProperty({ example: SummarySalesLog, description: '이번 주 판매 관련' })
  week: SummarySalesLog;
  @ApiProperty({ example: SummarySalesLog, description: '이번 달 판매 관련' })
  month: SummarySalesLog;
  @ApiProperty({ example: SummarySalesLog, description: '올해 판매 관련' })
  year: SummarySalesLog;
  @ApiProperty({ example: TopSales, description: '인기 상품 top 5', isArray: true })
  @IsArray()
  topSales: TopSales;
  @ApiProperty({ example: PriceRangeDto, description: '가격대 비율', isArray: true })
  @IsArray()
  priceRange: PriceRangeDto;
}
