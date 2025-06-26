import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max } from 'class-validator';

export class UploadImageDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  mimetype: string;

  @IsInt()
  @Max(5 * 1024 * 1024) // 최대 5MB
  size: number;
}

export class UpdateUserDto extends OmitType(PartialType(CreateUserDto), ['email', 'type']) {
  @ApiProperty({ example: 'current password', description: '현재 비밀번호' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'password', description: '변경할 비밀번호' })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    example: 'file(postman or web에서 실행해주세요 s3 url,key 변환으로 자동 변환)',
  })
  @IsOptional()
  @IsString()
  image?: string;
}
