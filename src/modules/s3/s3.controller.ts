import { Controller, Post, BadGatewayException } from '@nestjs/common';
import { S3Service, S3UploadResult } from './s3.service';
import { S3File, S3Upload } from 'src/common/decorators/s3.decorator';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';

class ImageDto {
  @ApiProperty({ example: 'imaeg file path', description: '이미지 파일 주소' })
  image: string;
}
@ApiTags('S3 (이미지 업로드)')
@Controller('s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @S3Upload('image')
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({ summary: 's3 이미지 업로드 Api', description: '이미지 업로드 url api' })
  @ApiBody({ type: ImageDto, description: '이미지 파일 업로드 body' })
  @ApiOkResponse({ example: { message: '업로드 성공', url: 's3File url', key: 's3File key' } })
  private uploadFile(@S3File() s3File: S3UploadResult) {
    if (!s3File) new BadGatewayException('업로드 오류');
    return { message: '업로드 성공', url: s3File.url, key: s3File.key };
  }

  // /**
  //  * 업로드된 파일을 다운로드하는 예시
  //  * key 파라미터로 S3 객체의 Key(예: "codiit/1685991234567-hello.jpg") 전달
  //  */
  // @Get('download/:key')
  // async getFile(@Param('key') key: string, @Res() res: Response): Promise<void> {
  //   const stream = await this.s3Service.getFileStream(key);
  //   // 적절한 헤더 설정(예: Content-Type; 간단히 octet-stream으로 지정)
  //   res.set({
  //     'Content-Type': 'application/octet-stream',
  //     'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`,
  //   });
  //   stream.pipe(res);
  // }

  // /**
  //  * 업로드된 파일을 삭제하는 예시
  //  */
  // @Delete('delete/:key')
  // async deleteFile(@Param('key') key: string): Promise<{ message: string }> {
  //   await this.s3Service.deleteFile(key);
  //   return { message: `"${key}" 파일이 삭제되었습니다.` };
  // }
}
