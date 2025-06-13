import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly Logger = new Logger(PrismaService.name);
  constructor() {
    super();
    // 미들웨어 등록
    this.$use(async (params: Prisma.MiddlewareParams, next) => {
      try {
        this.Logger.log(`${params.model}.${params.action}`);
        const result = await next(params);
        return result;
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          switch (e.code) {
            case 'P2002':
              throw new ConflictException('중복 레코드(ex: Unique)');
            case 'P2003':
              throw new ConflictException('데이터베이스 외래 키 제약 조건이 실패');
            case 'P2025':
              throw new NotFoundException('일치하는 데이터를 찾을 수 없습니다.');
            case 'P2004':
              throw new BadRequestException('값 범위 초과');
            case 'P2005':
              throw new BadRequestException('잘못된 값');
            case 'P2006':
              throw new BadRequestException('유효성 검사 오류');
            case 'P2014':
              throw new InternalServerErrorException('트랜잭션이 실패');
            default:
              throw new BadRequestException(e.message);
          }
        }
        throw new InternalServerErrorException('서버 내부 오류');
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
