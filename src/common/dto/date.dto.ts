import { ApiProperty } from '@nestjs/swagger';

export class CreatedAtDto {
  @ApiProperty({ example: '2025-05-28T12:34:56Z', description: '작성 일시' })
  createdAt: Date;

  @ApiProperty({ example: '2025-05-29T01:23:45Z', description: '수정 일시' })
  updatedAt: Date;
}
