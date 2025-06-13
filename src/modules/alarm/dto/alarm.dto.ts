import { ApiProperty } from '@nestjs/swagger';

export class AlarmDto {
  @ApiProperty({ example: 'alarm_123', description: '알람 ID' })
  id: string;

  @ApiProperty({ example: 'user_456', description: '사용자 ID' })
  userId: string;

  @ApiProperty({ example: '상품이 품절되었습니다.', description: '알람 내용' })
  content: string;

  @ApiProperty({ example: false, description: '알람 확인 여부' })
  isChecked: boolean;

  @ApiProperty({ example: '2025-06-03T12:00:00.000Z', description: '생성일시' })
  createdAt: Date;

  @ApiProperty({ example: '2025-06-03T12:00:00.000Z', description: '수정일시' })
  updatedAt: Date;
}
