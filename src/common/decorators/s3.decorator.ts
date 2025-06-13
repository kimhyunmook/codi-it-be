import {
  applyDecorators,
  UseInterceptors,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3UploadResult } from 'src/modules/s3/s3.service';
import { S3Interceptor } from '../interceptor/s3.interceptor';

/**
 * @S3Upload('fileFieldName')
 *
 * - first: FileInterceptor('fileFieldName') 를 붙여서
 *   멀터가 req.file을 Buffer 형태로 올려 주게 함
 * - next: S3Interceptor 를 붙여서 Buffer→S3 업로드 후 req.s3File에 결과 채워 놓음
 */
export function S3Upload(fieldName: string) {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor(fieldName, {
        // 필요하다면 파일 크기 제한 등 Multer 옵션을 추가할 수 있습니다.
        // limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한 등
        storage: undefined, // 기본 메모리 저장(버퍼) 사용
        fileFilter: (req, file, cb) => {
          // 예: 이미지 파일만 허용하고 싶다면
          if (!file.mimetype.startsWith('image/')) {
            return cb(null, false); // 허용하지 않음
          }
          cb(null, true);
        },
      }),
      S3Interceptor,
    ),
  );
}

/**
 * @S3File()
 *
 * - S3Interceptor가 req.s3File에 담아 놓은 S3UploadResult를 꺼내서
 *   메서드 파라미터에 주입합니다.
 */
export const S3File = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): S3UploadResult => {
    const req = ctx.switchToHttp().getRequest();
    return req.s3File;
  },
);
