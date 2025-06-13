import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagenation.dto';

export class FindStoreDto {
  @ApiProperty({ description: '스토어 ID', example: 'cmb0hxkuo0001iun0z6cupys0' })
  @IsString()
  @IsNotEmpty({ message: 'id는 필수 값 입니다.' })
  id: string;
}

export class MyStoreProductDto extends OmitType(PaginationQueryDto, ['search', 'sort']) {}
