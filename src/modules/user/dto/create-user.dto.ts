import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '@prisma/client';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

enum UserTypeEnum {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
}

export class CreateUserDto {
  @ApiProperty({ example: '김유저', description: '이름' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'user01@example.com', description: '이메일' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', description: '비밀번호' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @MaxLength(20, { message: '비밀번호는 최대 20자 이하이어야 합니다.' })
  password: string;

  // @ApiPropertyOptional({ example: 'image File', description: '이미지 파일' })
  // @IsOptional()
  // image?: string;

  @ApiPropertyOptional({
    enum: UserTypeEnum,
    example: UserType.BUYER,
    description: '유저 타입',
    default: UserType.BUYER,
  })
  @IsOptional()
  type?: UserType;
}
