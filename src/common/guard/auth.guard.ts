import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from 'src/modules/auth/auth.service';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const controller = context.getClass();

    // 1) @Public() 데코레이터가 붙은 경우 인증 스킵
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      handler,
      controller,
    ]);
    if (isPublic) {
      return true;
    }

    // 2) /signup, /login 경로는 인증 스킵 (필요 시 유지하거나 제거)
    if (req.path.startsWith('/api/auth/signup') || req.path.startsWith('/api/auth/login')) {
      return true;
    }

    // 3) accessToken 검증 시도
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Authorization 헤더가 없습니다.');
    }

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('잘못된 Authorization 헤더 형식입니다.');
    }

    try {
      // 4) accessToken 검증
      const payload = await this.authService.verifyAccessToken(token);
      req['user'] = payload;  // 요청 객체에 유저 정보 저장
      return true;

    } catch (err: any) {
      // accessToken 만료인 경우에만 refreshToken 검증 시도
      if (err.name !== 'TokenExpiredError') {
        throw new UnauthorizedException('유효하지 않은 access token입니다.');
      }

      // 5) 쿠키에서 refreshToken 추출
      if (!req.cookies || !req.cookies.refreshToken) {
        throw new UnauthorizedException('Access token 만료, Refresh token이 필요합니다.');
      }
      const refreshToken = req.cookies.refreshToken;

      try {
        // 6) refreshToken 검증 및 DB 일치 여부 확인 후 새 accessToken 발급
        const newAccessToken = await this.authService.verifyRefreshToken(refreshToken);
        const payload = await this.authService.verifyAccessToken(newAccessToken.accessToken);

        req['user'] = payload;
        req['newAccessToken'] = newAccessToken.accessToken; // 새 토큰 정보도 넣어둠 (필요 시 response에 담을 수 있도록)

        return true;
      } catch (refreshErr) {
        throw new UnauthorizedException('Refresh token이 유효하지 않습니다.');
      }
    }
  }
}
