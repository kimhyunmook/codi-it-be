import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Get,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
  OmitType,
} from '@nestjs/swagger';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import {
  FavoriteStoreResponseDto,
  MyStoreProductResponse,
  MyStoreResponse,
  StoreResponse,
} from './dto/response.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { S3File, S3Upload } from 'src/common/decorators/s3.decorator';
import { S3UploadResult } from '../s3/s3.service';
import { UserId } from 'src/types/common';
import { MyStoreProductDto } from './dto/find-store.dto';

@ApiTags('Store')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @S3Upload('image')
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({ summary: '새 스토어 등록', description: '내 스토어를 등록합니다 (1개만 가능)' })
  @ApiCreatedResponse({
    description: '등록된 스토어 정보를 반환합니다.',
    type: StoreResponse,
  })
  private async create(
    @Body() dto: CreateStoreDto,
    @CurrentUser('sub') userId: string,
    @S3File() s3File: S3UploadResult,
  ): Promise<StoreResponse> {
    return this.storeService.create({ ...dto, userId, image: s3File ? s3File.url : '' });
  }

  @Patch(':storeId')
  @ApiBearerAuth()
  @S3Upload('image')
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '스토어 수정', description: '내 스토어 정보 수정입니다.' })
  @ApiParam({ name: 'storeId', description: '수정할 스토어 ID', required: true })
  @ApiCreatedResponse({
    description: '수정된 스토어 정보를 반환합니다.',
    type: StoreResponse,
  })
  private async update(
    @Body() dto: UpdateStoreDto,
    @Param('storeId') storeId: string,
    @CurrentUser('sub') userId: UserId['userId'],
    @S3File() s3File: S3UploadResult,
  ): Promise<StoreResponse> {
    return this.storeService.update({
      ...dto,
      id: storeId,
      userId,
      image: s3File ? s3File.url : undefined,
    });
  }

  @Get(':storeId')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '스토어 상세 조회', description: '스토어 상세 조회입니다.' })
  @ApiParam({ name: 'storeId', description: '조회할 스토어 ID', required: true })
  @ApiCreatedResponse({
    description: '스토어 정보를 반환합니다.',
    type: OmitType(MyStoreResponse, ['productCount', 'monthFavoriteCount', 'totalSoldCount']),
  })
  private async findStore(
    @Param('storeId') storeId: string,
  ): Promise<Omit<MyStoreResponse, 'productCount' | 'monthFavoriteCount' | 'totalSoldCount'>> {
    return this.storeService.findStore({ id: storeId });
  }

  @Get('detail/my')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '내 스토어 상세 조회', description: '내 스토어 상세 조회입니다.' })
  @ApiCreatedResponse({
    description: '스토어 정보를 반환합니다.',
    type: MyStoreResponse,
  })
  private async myStore(@CurrentUser('sub') userId: UserId['userId']): Promise<MyStoreResponse> {
    return this.storeService.myStore({ userId });
  }

  @Get('detail/my/product')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  @ApiOperation({
    summary: '내 스토어 등록 상품 조회',
    description: '내 스토어 등록 상품 조회입니다.',
  })
  @ApiCreatedResponse({
    description: '스토어 등록 상품 정보를 반환합니다.',
    type: MyStoreProductResponse,
  })
  private async myStoreProduct(
    @Query() dto: MyStoreProductDto,
    @CurrentUser('sub') userId: UserId['userId'],
  ): Promise<MyStoreProductResponse> {
    return this.storeService.myStoreProduct({ ...dto, userId });
  }

  @Post(':storeId/favorite')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '관심 스토어 등록' })
  @ApiParam({ name: 'storeId', description: '관심 스토어 ID', required: true })
  @ApiCreatedResponse({ description: '관심 스토어 등록', type: FavoriteStoreResponseDto })
  private async favorteStoreRegister(
    @Param('storeId') storeId: string,
    @CurrentUser('sub') userId: UserId['userId'],
  ): Promise<FavoriteStoreResponseDto | undefined> {
    return this.storeService.favorite({ storeId, userId });
  }

  @Delete(':storeId/favorite')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '관심 스토어 해제' })
  @ApiParam({ name: 'storeId', description: '관심 스토어 ID', required: true })
  @ApiCreatedResponse({ description: '관심 스토어 해제', type: FavoriteStoreResponseDto })
  private async favorteStoreDelete(
    @Param('storeId') storeId: string,
    @CurrentUser('sub') userId: UserId['userId'],
  ): Promise<FavoriteStoreResponseDto> {
    return this.storeService.favoriteDelete({ storeId, userId });
  }
}
