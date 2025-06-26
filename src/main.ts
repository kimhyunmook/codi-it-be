import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExcludePropertiesInterceptor } from './common/interceptor/exclude-properties.interceptor';
import { AuthGuard } from './common/guard/auth.guard';
import { AuthService } from './modules/auth/auth.service';
import * as cookieParser from 'cookie-parser';
import swaggerConstant from './common/constants/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api'); // Api 경로 기본 설정

  // Swagger 설정 빌더
  const config = new DocumentBuilder()
    .setTitle(swaggerConstant.name)
    .setDescription(swaggerConstant.description)
    .setVersion(swaggerConstant.version)
    .addServer(process.env.NODE_ENV === 'development' ? '' : '/codiit')
    .addBearerAuth() // JWT 인증 토큰 사용 시
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/swagger', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 자동 타입 변환
      whitelist: true, // DTO에 없는 프로퍼티는 제거
      forbidNonWhitelisted: true, // 허용되지 않은 프로퍼티가 있으면 400 에러
      stopAtFirstError: true, // 첫 번째 에러에서 멈춤
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  // global interceptor
  const reflector = app.get(Reflector);
  const authService = app.get<AuthService>(AuthService);
  app.useGlobalInterceptors(new ExcludePropertiesInterceptor(reflector));
  app.useGlobalGuards(new AuthGuard(authService, reflector));
  app.use(cookieParser());

  // CORS 설정
  app.enableCors({
    origin: process.env.LOCALHOST_URL?.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
