import { ApiProperty } from '@nestjs/swagger';
import { UserErrorMsg } from '../constants/mesasge';

export class UserConFlictDto {
  @ApiProperty({ description: '에러 메세지', example: UserErrorMsg.Conflict })
  message: string;
  @ApiProperty({ description: 'HTTP 상태 코드', example: 409 })
  statusCode: number;
  @ApiProperty({ description: '에러 타입', example: 'ConFlict' })
  error: string;
}

export class UserNotFoundDto {
  @ApiProperty({ description: '에러 메세지', example: UserErrorMsg.NotFound })
  message: string;
  @ApiProperty({ description: 'HTTP 상태 코드', example: 404 })
  statusCode: number;
  @ApiProperty({ description: '에러 타입', example: 'Not Found' })
  error: string;
}
