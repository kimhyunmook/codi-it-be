import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'buyer@codiit.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'test1234' })
  @IsString()
  password: string;
}
