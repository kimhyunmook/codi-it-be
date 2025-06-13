import { Controller, Get, Param } from '@nestjs/common';
import { MetadataService } from './metadata.service';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CategoryResponse, GradeResponse, SizeResponse } from './dto/response';
import { Public } from 'src/common/decorators/public.decorator';

@Public()
@ApiTags('Metadata')
@Controller('metadata')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Get('size')
  @ApiOperation({ summary: '사이즈 값 조회', description: '사이즈 값 가져오기' })
  @ApiOkResponse({ type: SizeResponse, description: '사이즈 값', isArray: true })
  private async getSize() {
    return this.metadataService.getSize();
  }

  @Get('category/:name')
  @ApiParam({ name: 'name', type: Number, example: 'bottom', required: false })
  @ApiOperation({ summary: '카테고리 값 조회', description: '카테고리 값 가져오기' })
  @ApiOkResponse({ type: CategoryResponse, description: '카테고리 값 ', isArray: true })
  private async getCategory(@Param('name') target: string) {
    return this.metadataService.getCategory(target);
  }

  @Get('grade')
  @ApiOperation({ summary: '등급 값 조회', description: '등급 값 가져오기' })
  @ApiOkResponse({ type: GradeResponse, description: '등급 값 ', isArray: true })
  private async getGrade() {
    return this.metadataService.getGrade();
  }
}
