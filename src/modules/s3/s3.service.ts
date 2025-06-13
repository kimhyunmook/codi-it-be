import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export interface S3UploadResult {
  /**
   * 업로드된 객체의 URL (Public 또는 presigned URL)
   */
  url: string;
  /**
   * 저장된 버킷 내의 Key (예: 'codiit/filename.jpg')
   */
  key: string;
}

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private folderName: string;
  private region: string;

  constructor(private readonly configService: ConfigService) {
    // 1) 환경 변수에서 값을 읽어온 뒤, undefined 여부를 검사
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get<string>('AWS_REGION');
    const bucketName = this.configService.get<string>('S3_BUCKET_NAME');
    const folderName = this.configService.get<string>('S3_FOLDER_NAME');

    if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
      // 중요한 값이 하나라도 빠져 있으면 서버가 정상 동작할 수 없으므로 에러를 던집니다.
      throw new InternalServerErrorException(
        'AWS S3 설정에 필요한 환경 변수가 설정되지 않았습니다.',
      );
    }

    // 2) 이제 모든 값이 string 으로 확실하므로, 타입 단언 없이 바로 사용
    this.bucketName = bucketName;
    this.folderName = folderName || ''; // 폴더 이름은 선택적일 수 있으므로 기본값 '' 처리
    this.region = region;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: accessKeyId, // string 타입이 확실함
        secretAccessKey: secretAccessKey, // string 타입이 확실함
      },
    });
  }

  /**
   * 버퍼(Buffer) 또는 Readable Stream을 이용해 파일을 S3에 업로드합니다.
   * @param fileBuffer 업로드할 파일의 Buffer (Nest의 FileInterceptor가 제공)
   * @param originalName 원본 파일명 (확장자 유지)
   * @returns S3UploadResult
   */
  async uploadFileBuffer(fileBuffer: Buffer, originalName: string): Promise<S3UploadResult> {
    // S3에 저장될 Key 구성 (폴더/날짜-고유이름-원본파일명)
    const timestamp = Date.now();
    const key = `${this.folderName}/${timestamp}-${originalName}`;

    const params: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      // 필요에 따라 ContentType 설정 (이미지, 동영상 등)
      ContentType: this._getContentTypeFromFileName(originalName),
    };

    try {
      await this.s3Client.send(new PutObjectCommand(params));
      // 파일 업로드가 완료된 뒤 URL 반환 (공개 버킷이라면 아래와 같이 조립 가능)
      const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      return { url, key };
    } catch (error) {
      console.error('S3 Upload Error ▶', error);
      throw new InternalServerErrorException('파일 업로드에 실패했습니다.123');
    }
  }

  /**
   * presigned URL 방식으로 파일을 업로드하고자 할 때 사용 가능합니다.
   * (예: 클라이언트 측 브라우저에서 직접 S3에 업로드)
   * @param originalName 업로드할 파일의 이름 (확장자 포함)
   * @param expiresIn presigned URL 만료 시간 (초 단위, 기본 900초)
   * @returns presigned URL 문자열
   */
  async getPresignedUploadUrl(originalName: string, expiresIn = 900): Promise<S3UploadResult> {
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const timestamp = Date.now();
    const key = `${this.folderName}/${timestamp}-${originalName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: this._getContentTypeFromFileName(originalName),
    });
    try {
      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return { url, key };
    } catch (error) {
      console.error('S3 Presigned URL Error ▶', error);
      throw new InternalServerErrorException('Presigned URL 생성에 실패했습니다.');
    }
  }

  /**
   * S3에 저장된 객체를 Stream 형태로 가져옵니다.
   * @param key S3에 저장된 객체의 Key
   * @returns Readable Stream
   */
  async getFileStream(key: string): Promise<Readable> {
    const params: GetObjectCommandInput = {
      Bucket: this.bucketName,
      Key: key,
    };
    try {
      const command = new GetObjectCommand(params);
      const response = await this.s3Client.send(command);
      // response.Body: ReadableStream | Readable | Blob (node에서는 ReadableStream)
      return response.Body as Readable;
    } catch (error) {
      console.error('S3 GetObject Error ▶', error);
      throw new InternalServerErrorException('파일 조회에 실패했습니다.');
    }
  }

  /**
   * S3 버킷에서 객체를 삭제합니다.
   * @param key 삭제할 객체의 Key
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
    } catch (error) {
      console.error('S3 DeleteObject Error ▶', error);
      throw new InternalServerErrorException('파일 삭제에 실패했습니다.');
    }
  }

  /**
   * 간단한 파일 확장자 기반 Content-Type 반환 헬퍼
   */
  private _getContentTypeFromFileName(filename: string): string {
    const ext = filename.split('.').pop()!.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'pdf':
        return 'application/pdf';
      case 'txt':
        return 'text/plain';
      // 필요에 따라 더 추가
      default:
        return 'application/octet-stream';
    }
  }
}
