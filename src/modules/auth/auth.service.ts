import { Injectable, Req, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './dto/payload.interface';
import { User } from '@prisma/client';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    loginDto: LoginDto,
    res: Response,
  ): Promise<{ user: Partial<User>; accessToken: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: loginDto.email } });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const UserInfo = {
      id: user.id,
      email: user.email,
      name: user.name,
      type: user.type,
      points: user.points,
    };

    const payload: JwtPayload = { sub: user.id, email: user.email, type: user.type };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: process.env.NODE_ENV === 'development' ? '7d' : '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: '7d',
    });

    // ✅ Refresh Token을 DB에 저장
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // 쿠키로도 저장
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // HTTPS 환경에서만 전송
      sameSite: 'strict', // CSRF 공격 방지
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { user: UserInfo, accessToken };
  }

  async refresh(@Req() req): Promise<{ accessToken: string }> {
    const refreshToken = req.cookies['refreshToken'];

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
      { secret: process.env.ACCESS_TOKEN_SECRET, expiresIn: '15m' },
    );

    return { accessToken: newAccessToken };
  }


  async logout(userId: string): Promise<{ message: string }> {
    // ✅ DB의 refreshToken 제거
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: '성공적으로 로그아웃되었습니다.' };
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });
      return payload;
    } catch (error) {
      console.error('verifyAccessToken error:', error);
      throw new UnauthorizedException('유효하지 않은 액세스 토큰입니다.');
    }
  }

  async verifyRefreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('유효하지 않은 refresh token입니다.');
      }

      const newAccessToken = await this.jwtService.signAsync(
        { sub: payload.sub, email: payload.email, type: payload.type },
        { secret: process.env.ACCESS_TOKEN_SECRET, expiresIn: '15m' },
      );

      return { accessToken: newAccessToken };
    } catch (error) {
      console.error('verifyRefreshToken error:', error);
      throw new UnauthorizedException('유효하지 않은 refresh token입니다.');
    }
  }
}
