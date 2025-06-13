import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class FavoirteStoreDto {
  @ApiProperty({ description: '스토어 ID', example: 'cmb4nmzky0001iu5828t1m6jh' })
  @IsString()
  @IsNotEmpty()
  storeId: string;

  @ApiProperty({ description: '사용자 ID', example: 'cmb4p5cux0001iu3wazt3gnc7' })
  @IsString()
  @IsNotEmpty()
  userId: string;
}
