import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { StoreModule } from './modules/store/store.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { ReviewModule } from './modules/review/review.module';
import { InquiryModule } from './modules/inquiry/inquiry.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AlarmModule } from './modules/alarm/alarm.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard } from './common/guard/auth.guard';
import { AuthService } from './modules/auth/auth.service';
import { Reflector } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { S3Module } from './modules/s3/s3.module';
import { ConfigModule } from '@nestjs/config';
import { S3Controller } from './modules/s3/s3.controller';
import { MetadataModule } from './modules/metadata/metadata.module';
@Module({
  imports: [
    PrismaModule,
    AuthModule, // AuthService를 export 하고 있는 모듈
    UserModule,
    ProductModule,
    StoreModule,
    CartModule,
    OrderModule,
    ReviewModule,
    InquiryModule,
    DashboardModule,
    AlarmModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env',
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    S3Module,
    MetadataModule, // S3 관련 모듈
  ],
  controllers: [AppController, S3Controller],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useFactory: (authService: AuthService, reflector: Reflector) =>
        new AuthGuard(authService, reflector),
      inject: [AuthService, Reflector],
    },
  ],
})
export class AppModule {}
