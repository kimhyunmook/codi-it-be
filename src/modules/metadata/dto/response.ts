import { ApiProperty } from '@nestjs/swagger';
import { Category, Grade, Size } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';

export enum CategoryEnum {
  all = ' all',
  top = 'top',
  bottom = 'bottom',
  dress = 'dress',
  outer = 'outer',
  skirt = 'skirt',
  shoes = 'shoes',
  acc = 'acc',
}

export enum SizeEnum {
  Free = 'Free',
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
}

export class SizeResponse implements Size {
  @ApiProperty({ description: '사이즈 json', example: { ko: 'L', en: 'Large' } })
  size: JsonValue;
  @ApiProperty({ description: '사이즈 name', example: 'L', enum: SizeEnum })
  name: string;
  @ApiProperty({ description: '사이즈 ID', example: 'CUID' })
  id: number;
}

export class CategoryResponse implements Category {
  @ApiProperty({ description: '카테고리 이름', example: 'bottom', enum: CategoryEnum })
  name: string;

  @ApiProperty({ description: '카테고리 ID', example: 'CUID' })
  id: string;
}

export class GradeResponse implements Grade {
  @ApiProperty({ description: '등급 이름', example: 'green' })
  name: string;
  @ApiProperty({ description: '등급 ID', example: 'grade_green' })
  id: string;
  @ApiProperty({ description: '할인 율', example: 5 })
  rate: number;
  @ApiProperty({ description: '달성 최소 금액', example: 1000000 })
  minAmount: number;
}
