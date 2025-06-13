import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateStoreDto } from './create-store.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateStoreDto extends PartialType(CreateStoreDto) {}

export class UpdateStoreNeedIdDto extends PartialType(CreateStoreDto) {
  @ApiProperty({ description: '스토어 ID', example: 'cmb0hxkuo0001iun0z6cupys0' })
  @IsString()
  @IsNotEmpty({ message: 'id는 필수 값 입니다.' })
  id: string;
}
