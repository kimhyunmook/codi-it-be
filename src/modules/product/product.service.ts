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
import { Prisma } from '@prisma/client';
import DiscountPrice from 'src/common/utils/discountPrice';

const include: Prisma.ProductInclude = {
  store: { select: { id: true, name: true } },
  stocks: {
    select: { id: true, quantity: true, size: { select: { id: true, name: true } } },
  },
  category: true,
  reviews: true,
  inquiries: {
    select: {
      id: true,
      title: true,
      content: true,
      status: true,
      isSecret: true,
      createdAt: true,
      updatedAt: true,
      reply: {
        select: {
          id: true,
          content: true,
          user: { select: { id: true, name: true } },
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  },
};

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

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
    } = dto;

    return await this.prisma.$transaction(async (tx) => {
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
        include,
      });
      if (!result) throw new NotFoundException(ProductErrorMsg.NotFound);
      const {
        store: resultStore,
        discountRate: resultDiscountRate,
        discountEndTime: resultDiscountEndTIme,
        discountStartTime: resultDiscountStartTime,
        price: resultPrice,
        ...args
      } = result;
      const storeName = resultStore.name;
      let discountPrice = resultPrice;
      if (resultDiscountEndTIme && resultDiscountStartTime) {
        discountPrice = DiscountPrice(resultPrice, resultDiscountRate);
      }
      return {
        storeName,
        price: resultPrice,
        discountPrice,
        discountRate: resultDiscountRate,
        discountEndTime: resultDiscountEndTIme,
        discountStartTime: resultDiscountStartTime,
        ...args,
      };
    });
  }

  public async update(dto: UpdateProductDto & UserId): Promise<DetailProductResponse> {
    const {
      userId,
      name,
      discountEndTime,
      discountRate,
      discountStartTime,
      price,
      image,
      categoryName,
    } = dto;

    const product = await this.prisma.$transaction(async (tx) => {
      const store = await tx.store.findFirst({
        where: { userId },
      });
      if (!store) throw new NotFoundException(StoreErrorMsg.NotFound);

      const targetProduct = await tx.product.findFirst({
        where: { storeId: store.id },
      });
      if (!targetProduct) throw new NotFoundException(ProductErrorMsg.NotFound);

      const category = await tx.category.findFirst({ where: { name: categoryName } });
      if (!category) throw new NotFoundException(ProductErrorMsg.NotCategory);

      const result = await tx.product.update({
        where: { id: targetProduct.id },
        data: {
          name,
          discountEndTime,
          discountStartTime,
          discountRate,
          price,
          image,
          categoryId: category.id,
        },
        include,
      });
      const {
        store: resultStore,
        discountRate: resultDiscountRate,
        discountEndTime: resultDiscountEndTIme,
        discountStartTime: resultDiscountStartTime,
        price: resultPrice,
        ...args
      } = result;
      const storeName = resultStore.name;
      let discountPrice = resultPrice;
      if (resultDiscountEndTIme && resultDiscountStartTime) {
        discountPrice = DiscountPrice(resultPrice, resultDiscountRate);
      }
      return {
        storeName,
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
        orderBy = {};
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
          name: {
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

      let responseList: ProductListDto[] = list.map((product) => {
        const {
          discountRate,
          discountEndTime,
          discountStartTime,
          price,
          reviews,
          SalesLog,
          store,
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

        // const reviewsRating =
        //   reviews.length > 0
        //     ? reviews.reduce((acc, cur) => acc + cur.rating, 0) / reviews.length
        //     : 0;

        return {
          ...args,
          storeName,
          price,
          discountStartTime,
          discountEndTime,
          discountPrice,
          discountRate,
          // reviewsRating,
          sales,
          reviewsCount: reviews.length,
        };
      });
      if (orderBy === SortOption.HIGH_RATING)
        responseList = responseList.sort((a, b) => b.reviewsRating - a.reviewsRating);

      return {
        list: responseList,
        totalCount,
      };
    });
  }

  async findProduct(dto: FindProductDto): Promise<DetailProductResponse> {
    const { productId } = dto;

    const product = await this.prisma.$transaction(async (tx) => {
      const result = await tx.product.findUnique({
        where: { id: productId },
        include,
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
        reviews,
        inquiries,
        category,
        stocks,
      };
    });
    return product;
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
