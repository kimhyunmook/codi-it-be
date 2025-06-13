import { Controller, Post, Body, Res, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiBody, ApiBearerAuth, ApiTags, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { UseGuards } from '@nestjs/common';
import { Req } from '@nestjs/common';
import { Response } from 'express';
import { SwaggerErrorExamples } from 'src/common/utils/swagger-error-response.util';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/common/prisma/prisma.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: '로그인 및 Access/Refresh 토큰 발급' })
  @ApiResponse({
    status: 201,
    description: '로그인 성공했습니다.',
    schema: {
      example: {
        user: {
          id: 'abcd1234',
          email: 'user@example.com',
          name: 'TestUser',
          type: 'Buyer',
          points: '1000',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '로그인 실패했습니다.',
    schema: {
      example: {
        statusCode: 401,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '사용자를 찾을 수 없습니다',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청입니다',
    schema: { example: SwaggerErrorExamples.BadRequest },
  })
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(loginDto, res);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh Token으로 Access Token 재발급' })
  @ApiResponse({
    status: 200,
    description: 'Access Token 재발급 성공',
    schema: {
      example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - 유효하지 않거나 만료된 Refresh Token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청입니다',
    schema: { example: SwaggerErrorExamples.BadRequest },
  })
  async refresh(@Req() req): Promise<{ accessToken: string }> {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 없습니다.');
    }

    const decoded = await this.jwtService.verifyAsync(refreshToken, {
      secret: process.env.REFRESH_TOKEN_SECRET,
    });

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    const newAccessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: user.type },
      {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: '15m',
      },
    );

    return { accessToken: newAccessToken };
  }


  @Post('logout')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '로그아웃',
    description: '로그인된 사용자의 세션(리프레시 토큰)을 제거합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그아웃 성공',
    schema: { example: { message: '성공적으로 로그아웃되었습니다.' } },
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않음',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  async logout(@CurrentUser('sub') userId: string) {
    return this.authService.logout(userId);
  }
}
