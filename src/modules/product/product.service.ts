import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UserId } from 'src/types/common';
import { StoreErrorMsg } from '../store/constants/message';
import { ProductErrorMsg } from './constants/message';
import { FindListProductDto, FindProductDto } from './dto/find-product.dto';
import { SortOption } from 'src/common/dto/pagenation.dto';
import { DeleteProductDto } from './dto/delete-product.dto';
import {
  DetailProductResponse,
  ProductListDto,
  ProductListResponse,
  ProductResponse,
} from './dto/response';
import { Prisma, Review } from '@prisma/client';
import DiscountPrice from 'src/common/utils/discountPrice';
import { ProductInclude } from './fragments/include';
import { AlarmService } from '../alarm/alarm.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alarmService: AlarmService,
  ) {}

  public async create(dto: CreateProductDto & UserId): Promise<DetailProductResponse> {
    const {
      userId,
      name,
      discountEndTime,
      discountRate,
      discountStartTime,
      price,
      image,
      categoryName,
      stocks,
      content,
    } = dto;

    const product = await this.prisma.$transaction(async (tx) => {
      const store = await tx.store.findFirst({
        where: {
          userId,
        },
      });
      if (!store) throw new NotFoundException(StoreErrorMsg.NotFound);

      const exist = await tx.product.findFirst({
        where: { name, price, storeId: store.id, discountRate, discountStartTime, discountEndTime },
      });

      if (exist) throw new BadRequestException(ProductErrorMsg.Exist);

      const category = await tx.category.findFirst({
        where: { name: categoryName },
      });
      if (!category) throw new NotFoundException(ProductErrorMsg.NotCategory);
      const product = await tx.product.create({
        data: {
          name,
          discountEndTime,
          discountRate,
          discountStartTime,
          price,
          image,
          storeId: store.id,
          categoryId: category.id,
          content,
        },
      });

      const stock = await tx.stock.createManyAndReturn({
        data: stocks.map(
          (data): Prisma.StockCreateManyInput => ({
            productId: product.id,
            sizeId: data.sizeId,
            quantity: data.quantity,
          }),
        ),
      });

      if (stock.length !== stocks.length) {
        await tx.product.delete({
          where: { id: product.id },
        });
        await tx.stock.deleteMany({
          where: {
            id: { in: stock.map((data) => data.id) },
          },
        });
        throw new InternalServerErrorException('생성 오류');
      }

      const result = await tx.product.findUnique({
        where: { id: product.id },
        include: ProductInclude,
      });
      if (!result) throw new NotFoundException(ProductErrorMsg.NotFound);
      const {
        store: resultStore,
        discountRate: resultDiscountRate,
        discountEndTime: resultDiscountEndTIme,
        discountStartTime: resultDiscountStartTime,
        price: resultPrice,
        reviews,
        ...args
      } = result;
      const storeName = resultStore.name;
      let discountPrice = resultPrice;
      if (resultDiscountEndTIme && resultDiscountStartTime) {
        discountPrice = DiscountPrice(resultPrice, resultDiscountRate);
      }
      const reviewContent = this.reviewsContent(reviews);

      return {
        storeName,
        reviews: reviewContent,
        price: resultPrice,
        discountPrice,
        discountRate: resultDiscountRate,
        discountEndTime: resultDiscountEndTIme,
        discountStartTime: resultDiscountStartTime,
        ...args,
      };
    });

    await this.alarmService.createNewProductInFavoriteStoreAlarm(product.storeId, name);

    return product;
  }

  public async update(dto: UpdateProductDto & UserId): Promise<DetailProductResponse> {
    const {
      id,
      userId,
      name,
      discountEndTime,
      discountRate,
      discountStartTime,
      price,
      image,
      content,
      categoryName,
      isSoldOut,
      stocks,
    } = dto;
    const booleanSoldOut = isSoldOut === 'true' ? true : false;
    const product = await this.prisma.$transaction(async (tx) => {
      const store = await tx.store.findFirst({
        where: { userId },
      });
      if (!store) throw new NotFoundException(StoreErrorMsg.NotFound);

      const targetProduct = await tx.product.findFirst({
        where: { storeId: store.id, id },
      });
      if (!targetProduct) throw new NotFoundException(ProductErrorMsg.NotFound);

      const category = await tx.category.findFirst({ where: { name: categoryName } });
      if (!category) throw new NotFoundException(ProductErrorMsg.NotCategory);

      if (stocks) {
        const parse = JSON.parse(stocks);
        await tx.stock.deleteMany({
          where: { productId: targetProduct.id },
        });
        await tx.stock.createManyAndReturn({
          data: parse.map((data): Prisma.StockCreateManyInput => {
            return {
              productId: targetProduct.id,
              sizeId: data.sizeId,
              quantity: data.quantity,
            };
          }),
        });
      }

      const result = await tx.product.update({
        where: { id: targetProduct.id },
        data: {
          name: name ? name : targetProduct.name,
          discountEndTime: discountEndTime ? discountEndTime : targetProduct.discountEndTime,
          discountStartTime: discountStartTime
            ? discountStartTime
            : targetProduct.discountStartTime,
          discountRate: discountRate ? Number(discountRate) : targetProduct.discountRate,
          content,
          price: price ? Number(price) : targetProduct.price,
          image: image ? image : targetProduct.image,
          categoryId: category.id,
          isSoldOut: booleanSoldOut,
        },
        include: ProductInclude,
      });

      const {
        store: resultStore,
        discountRate: resultDiscountRate,
        discountEndTime: resultDiscountEndTIme,
        discountStartTime: resultDiscountStartTime,
        price: resultPrice,
        reviews,
        ...args
      } = result;
      const storeName = resultStore.name;
      let discountPrice = resultPrice;
      if (resultDiscountEndTIme && resultDiscountStartTime) {
        discountPrice = DiscountPrice(resultPrice, resultDiscountRate);
      }
      const reviewContent = this.reviewsContent(reviews);

      return {
        storeName,
        reviews: reviewContent,
        price: resultPrice,
        discountPrice,
        discountRate: resultDiscountRate,
        discountEndTime: resultDiscountEndTIme,
        discountStartTime: resultDiscountStartTime,
        ...args,
      };
    });

    return product;
  }

  public async findListProduct(dto: FindListProductDto): Promise<ProductListResponse> {
    const {
      page = 1,
      pageSize = 16,
      search,
      sort,
      size,
      priceMin,
      priceMax,
      favoriteStore,
      categoryName,
    } = dto;

    let orderBy: any = { createdAt: 'desc' };
    switch (sort) {
      case SortOption.MOST_REVIEWED:
        orderBy = {
          reviews: {
            _count: 'desc',
          },
        };
        break;
      case SortOption.LOW_PRICE:
        orderBy = { price: 'asc' };
        break;
      case SortOption.HIGH_PRICE:
        orderBy = { price: 'desc' };
        break;
      case SortOption.RECENT:
        orderBy = { createdAt: 'desc' };
        break;
      case SortOption.HIGH_RATING:
        orderBy = { reviewsRating: 'desc' };
        break;
      case SortOption.SALES_RANKING:
        orderBy = {
          SalesLog: { _count: 'desc' },
        };
        break;
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }
    const strSearch = String(search);
    const where: Prisma.ProductWhereInput = {
      ...(priceMin != null || priceMax != null
        ? {
            price: {
              ...(priceMin != null && { gte: priceMin }),
              ...(priceMax != null && { lte: priceMax }),
            },
          }
        : {}),

      ...(favoriteStore && {
        store: {
          id: {
            contains: favoriteStore,
            mode: 'insensitive',
          },
        },
      }),

      ...(size && {
        stocks: {
          some: {
            size: {
              name: {
                contains: size,
                mode: 'insensitive',
              },
            },
          },
        },
      }),

      ...(search && {
        OR: [
          {
            name: {
              contains: strSearch,
              mode: 'insensitive',
            },
          },
          {
            store: {
              name: {
                contains: strSearch,
                mode: 'insensitive',
              },
            },
          },
          {
            category: {
              name: {
                contains: strSearch,
                mode: 'insensitive',
              },
            },
          },
        ],
      }),
      ...(categoryName && {
        category: {
          name: { contains: categoryName, mode: 'insensitive' },
        },
      }),
    };

    return await this.prisma.$transaction(async (tx) => {
      const list = await tx.product.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        include: {
          store: { select: { name: true } },
          reviews: { select: { rating: true } },
          SalesLog: { select: { quantity: true } },
        },
        orderBy,
      });
      const totalCount = await tx.product.count({
        where,
      });
      const now = new Date();

      const responseList: ProductListDto[] = list.map((product) => {
        const {
          discountRate,
          discountEndTime,
          discountStartTime,
          price,
          reviews,
          SalesLog,
          store,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          content,
          ...args
        } = product;
        const storeName = store.name;
        let discountPrice = price;
        if (discountRate && discountStartTime && discountEndTime) {
          if (now >= discountStartTime && now <= discountEndTime) {
            discountPrice = price - (price * discountRate) / 100;
          }
        }

        const sales = SalesLog.reduce((a, c) => a + c.quantity, 0);

        return {
          ...args,
          storeName,
          price,
          discountStartTime,
          discountEndTime,
          discountPrice,
          discountRate,
          sales,
          reviewsCount: reviews.length,
        };
      });

      return {
        list: responseList,
        totalCount,
      };
    });
  }

  private reviewsContent(reviews: Review[]) {
    const reviewContent = reviews.reduce(
      (a, c, i) => {
        switch (c.rating) {
          case 1:
            a = { ...a, rate1Length: a.rate1Length + 1 };
            break;
          case 2:
            a = { ...a, rate2Length: a.rate2Length + 1 };
            break;
          case 3:
            a = { ...a, rate3Length: a.rate3Length + 1 };
            break;
          case 4:
            a = { ...a, rate4Length: a.rate4Length + 1 };
            break;
          case 5:
            a = { ...a, rate5Length: a.rate5Length + 1 };
            break;
        }
        a.sumScore += c.rating;
        if (i === reviews.length - 1) a.sumScore = a.sumScore / reviews.length;
        return a;
      },
      {
        rate1Length: 0,
        rate2Length: 0,
        rate3Length: 0,
        rate4Length: 0,
        rate5Length: 0,
        sumScore: 0,
      },
    );
    return reviewContent;
  }

  public async findProduct(dto: FindProductDto): Promise<DetailProductResponse> {
    const { productId } = dto;

    return await this.prisma.$transaction(async (tx) => {
      const result = await tx.product.findUnique({
        where: { id: productId },
        include: ProductInclude,
      });
      if (!result) throw new NotFoundException(ProductErrorMsg.NotFound);
      const {
        store,
        storeId,
        inquiries,
        category,
        stocks,
        price,
        reviews,
        discountRate,
        discountEndTime,
        discountStartTime,
        ...args
      } = result;
      const storeName = store.name;
      const reviewsCount = await tx.review.count({ where: { productId } });
      let discountPrice = price;
      if (discountStartTime && discountEndTime) {
        discountPrice = DiscountPrice(price, discountRate);
      }

      const reviewContent = this.reviewsContent(reviews);

      return {
        ...args,
        storeId,
        storeName,
        price,
        discountPrice,
        discountRate,
        discountStartTime,
        discountEndTime,
        reviewsCount,
        reviews: reviewContent,
        inquiries,
        category,
        stocks,
      };
    });
  }

  async deleteProduct(dto: DeleteProductDto & UserId): Promise<ProductResponse> {
    const { productId, userId } = dto;
    const result = await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { store: { select: { userId: true } } },
      });
      if (!product) throw new NotFoundException(ProductErrorMsg.NotFound);
      if (product.store.userId !== userId) throw new ForbiddenException('권한이 없습니다.');

      return await tx.product.delete({
        where: { id: productId },
      });
    });
    return result;
  }
}
