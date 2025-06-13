import { ApiProperty } from '@nestjs/swagger';

export class StoreNotFoundDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: '스토어를 찾을 수 없습니다.' })
  message: string;

  @ApiProperty({ example: 'Not Found' })
  error: string;
}
