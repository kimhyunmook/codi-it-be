import { Prisma } from '@prisma/client';
import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Prisma 에러 코드를 적절한 HTTP 응답으로 변환하여 일관된 예외 처리
 * 필요한 경우 더 추가
 */
export async function wrapPrisma<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      switch (e.code) {
        case 'P2002':
          throw new HttpException('중복 레코드(ex: Unique)', HttpStatus.CONFLICT);
        case 'P2003':
          throw new HttpException('데이터베이스 외래 키 제약 조건이 실패', HttpStatus.CONFLICT);
        case 'P2025':
          throw new HttpException('레코드 찾을 수 없음', HttpStatus.NOT_FOUND);
        case 'P2004':
          throw new HttpException('값 범위 초과', HttpStatus.BAD_REQUEST);
        case 'P2005':
          throw new HttpException('잘못된 값', HttpStatus.BAD_REQUEST);
        case 'P2006':
          throw new HttpException('유효성 검사 오류', HttpStatus.BAD_REQUEST);
        case 'P2014':
          throw new HttpException('트랜잭션이 실패', HttpStatus.INTERNAL_SERVER_ERROR);
        default:
          throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
      }
    }
    throw new HttpException('서버 오류', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
