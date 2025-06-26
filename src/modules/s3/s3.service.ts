import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommandInput,
  GetObjectCommandInput,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export interface S3UploadResult {
  url: string;
  key: string;
}

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private folderName: string;
  private region: string;

  constructor(private readonly configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    const region = this.configService.get<string>('AWS_REGION');
    const bucketName = this.configService.get<string>('S3_BUCKET_NAME');
    const folderName = this.configService.get<string>('S3_FOLDER_NAME');

    if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
      throw new InternalServerErrorException(
        'AWS S3 설정에 필요한 환경 변수가 설정되지 않았습니다.',
      );
    }

    this.bucketName = bucketName;
    this.folderName = folderName || '';
    this.region = region;

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
  }

  async getAllImageKeys(): Promise<string[]> {
    const imageKeys: string[] = [];
    let isTruncated = true;
    let continuationToken: string | undefined = undefined;

    while (isTruncated) {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: this.folderName,
        ContinuationToken: continuationToken,
      });

      const response: ListObjectsV2CommandOutput = await this.s3Client.send(command);
      const contents = response.Contents ?? [];

      for (const item of contents) {
        if (
          item.Key &&
          (item.Key.endsWith('.jpg') ||
            item.Key.endsWith('.jpeg') ||
            item.Key.endsWith('.png') ||
            item.Key.endsWith('.webp'))
        ) {
          imageKeys.push(item.Key);
        }
      }

      isTruncated = response.IsTruncated ?? false;
      continuationToken = response.NextContinuationToken;
    }

    return imageKeys;
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
