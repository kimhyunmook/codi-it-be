import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  InternalServerErrorException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { S3Service, S3UploadResult } from 'src/modules/s3/s3.service';

/** S3Interceptor를 통해 업로드된 파일 */
declare module 'express' {
  interface Request {
    s3File?: S3UploadResult;
  }
}

@Injectable()
export class S3Interceptor implements NestInterceptor {
  constructor(private readonly s3Service: S3Service) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    // 만약 Multipart → file 이 없으면 그냥 넘어갑니다.
    const file: Express.Multer.File = req.file;
    if (file) {
      try {
        const uploadResult = await this.s3Service.uploadFileBuffer(file.buffer, file.originalname);
        // 업로드 결과를 request 객체에 붙여 둡니다.
        req.s3File = uploadResult;
      } catch (err) {
        console.error('S3Interceptor 업로드 오류:', err);
        throw new InternalServerErrorException('파일 업로드 중 오류가 발생했습니다.');
      }
    }

    return next.handle();
  }
}
