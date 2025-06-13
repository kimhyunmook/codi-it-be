import {
  Controller,
  HttpCode,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ProductService } from './product.service';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiNoContentResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQueryDto, SortOption } from 'src/common/dto/pagenation.dto';
import { FindListProductDto, FindProductDto } from './dto/find-product.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { DeleteProductDto } from './dto/delete-product.dto';
import {
  ProductBadRequestDto,
  ProductForbiddenDto,
  ProductNotFoundDto,
} from './dto/error-product.dto';
import { InquiryService } from '../inquiry/inquiry.service';
import { CreateInquiryDto } from '../inquiry/dto/create-inquiry.dto';
import { DetailProductResponse, ProductListResponse, ProductResponse } from './dto/response';
import { Inquiry } from '@prisma/client';
import { InquiryResponse } from '../inquiry/dto/response';
import { InquiriesResponse } from '../inquiry/dto/response';
// impsort { S3File, S3Upload } from 'src/common/decorators/s3.decorator';
// import { S3UploadResult } from '../s3/s3.service';

@ApiTags('Product')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly inquiryService: InquiryService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  // @S3Upload('image')
  // @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({ summary: '새 상품 등록', description: '상품 등록' })
  @ApiCreatedResponse({
    description: '등록된 상품 정보를 반환합니다.',
    type: DetailProductResponse,
  })
  @ApiNotFoundResponse({
    description: '스토어를 찾을 수 없습니다. | 카테고리가 없습니다.',
    type: ProductNotFoundDto,
  })
  @ApiBadRequestResponse({
    description: '이미 상품이 존재합니다.',
    type: ProductBadRequestDto,
  })
  private async create(
    @Body() dto: CreateProductDto,
    @CurrentUser('sub') userId: string,
    // @S3File() s3File: S3UploadResult,
  ): Promise<DetailProductResponse> {
    return this.productService.create({
      ...dto,
      userId,
      // image: s3File ? s3File.url : undefined
    });
  }

  @Patch(':productId')
  @HttpCode(HttpStatus.OK)
  // @S3Upload('image')
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({ summary: '상품 수정' })
  @ApiParam({ name: 'productId', description: '조회할 상품 ID' })
  @ApiOkResponse({ type: DetailProductResponse, description: '수정된 상품 정보 반환합니다' })
  @ApiNotFoundResponse({
    description: '상품을 찾을 수 없습니다. | 카테고리가 없습니다.',
    type: ProductNotFoundDto,
  })
  private async update(
    @Body() dto: UpdateProductDto,
    @CurrentUser('sub') userId: string,
    // @S3File() s3File: S3UploadResult,
  ): Promise<DetailProductResponse> {
    return this.productService.update({
      ...dto,
      userId,
      // image: s3File ? s3File.url : undefined
    });
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '상품 목록 조회', description: '페이징, 검색, 정렬이 가능합니다.' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 16 })
  @ApiQuery({ name: 'search', required: false, type: String, example: '가디건' })
  @ApiQuery({ name: 'sort', required: false, enum: SortOption, example: SortOption.RECENT })
  @ApiOkResponse({
    description: '상품 리스트 및 메타정보 반환',
    type: ProductListResponse,
  })
  @ApiNotFoundResponse({
    description: '상품을 찾을 수 없습니다. | 카테고리가 없습니다.',
    type: ProductNotFoundDto,
  })
  private async findList(@Query() dto: FindListProductDto): Promise<ProductListResponse> {
    return this.productService.findListProduct(dto);
  }

  @Get(':productId')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '상품 정보 조회', description: '상품 정보 조회' })
  @ApiParam({ name: 'productId', description: '조회할 상품 ID' })
  @ApiOkResponse({
    description: '상품 정보 및 메타정보 반환',
    type: DetailProductResponse,
  })
  @ApiNotFoundResponse({
    description: '상품을 찾을 수 없습니다.',
    type: ProductNotFoundDto,
  })
  private async findProduct(@Param() dto: FindProductDto): Promise<DetailProductResponse> {
    return this.productService.findProduct(dto);
  }

  @Delete(':productId')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '상품 삭제', description: '본인이 소유한 상품을 삭제합니다.' })
  @ApiParam({ name: 'productId', description: '삭제할 상품 ID', required: true, type: String })
  @ApiNoContentResponse({
    description: '상품이 정상적으로 삭제되었습니다.',
    type: ProductForbiddenDto,
  })
  @ApiForbiddenResponse({ description: '상품 삭제 권한이 없습니다.', type: ProductNotFoundDto })
  private async remove(
    @Param() dto: DeleteProductDto,
    @CurrentUser('sub') userId: string,
  ): Promise<ProductResponse> {
    return await this.productService.deleteProduct({ ...dto, userId });
  }

  @Post(':productId/inquiries')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '상품 문의 등록', description: '상품에 대한 문의를 등록합니다.' })
  @ApiParam({ name: 'productId', description: '상품 Id', type: String })
  @ApiCreatedResponse({
    description: '상품 문의를 만들고 생성된 문의 정보를 반환합니다.',
    type: InquiryResponse,
  })
  @ApiNotFoundResponse({
    description: '상품을 찾을 수 없습니다.',
    type: ProductNotFoundDto,
  })
  private async createInquiry(
    @Param('productId') productId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateInquiryDto,
  ): Promise<Inquiry> {
    return this.inquiryService.create({ ...dto, productId, userId });
  }

  @Get(':productId/inquiries')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '상품 문의 조회', description: '상품에 대한 모든 문의를 조회합니다.' })
  @ApiOkResponse({
    description: '상품 문의 리스트를 반환합니다.',
    type: InquiriesResponse,
    isArray: true,
  })
  @ApiNotFoundResponse({ description: '상품을 찾을 수 없습니다.', type: ProductNotFoundDto })
  private async getListInquiry(
    @Query() query: Pick<PaginationQueryDto, 'page' | 'pageSize'>,
    @Param('productId') productId: string,
  ) {
    return this.inquiryService.findAll({ productId });
  }
}
