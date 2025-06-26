import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import {
  FavoriteStoreResponseDto,
  MyStoreProductResponse,
  MyStoreResponse,
  StoreResponse,
} from './dto/response.dto';
import { UpdateStoreNeedIdDto } from './dto/update-store.dto';
import { FindStoreDto, MyStoreProductDto } from './dto/find-store.dto';
import { FavoirteStoreDto } from './dto/favorite-store.dto';
import { StoreErrorMsg } from './constants/message';
import { TxPrisma, UserId } from 'src/types/common';
import { UserService } from '../user/user.service';
import { AuthErrorMsg } from '../auth/constants/message';
import { ProductErrorMsg } from '../product/constants/message';
import { Prisma } from '@prisma/client';
import { endOfMonth, startOfMonth } from 'date-fns';

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  public async txFindStore(
    tx: TxPrisma,
    storeId: string,
    args?: Omit<Prisma.StoreFindUniqueArgs, 'where'>,
  ) {
    if (!storeId) throw new BadRequestException(StoreErrorMsg.BadRequest);
    const store = await tx.store.findUnique({
      ...args,
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException(StoreErrorMsg.NotFound);
    return store;
  }

  /** 스토어 조회 */
  public async findStore(
    dto: FindStoreDto,
  ): Promise<Omit<MyStoreResponse, 'productCount' | 'monthFavoriteCount' | 'totalSoldCount'>> {
    const { id } = dto;
    return await this.prisma.$transaction(async (tx: TxPrisma) => {
      const result: any = await this.txFindStore(tx, id, {
        include: { _count: { select: { favoriteBy: true } } },
      });
      if (!result) throw new NotFoundException(StoreErrorMsg.NotFound);
      const { _count, ...args } = result;
      const favoriteCount = _count.favoriteBy;
      return { ...args, favoriteCount };
    });
  }

  public async myStore(dto: UserId): Promise<MyStoreResponse> {
    const { userId: loginId } = dto;
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    return await this.prisma.$transaction(async (tx) => {
      const me = await tx.user.findUnique({ where: { id: loginId }, select: { id: true } });
      if (!me) throw new NotFoundException(StoreErrorMsg.NotFound);

      const myStore = await tx.store.findFirst({
        where: { userId: me.id },
        include: {
          _count: { select: { products: true, favoriteBy: true } },
          products: { select: { SalesLog: { select: { quantity: true } } } },
        },
      });
      if (!myStore) throw new NotFoundException(StoreErrorMsg.NotFound);
      const monthFavorite = await tx.store.findUnique({
        where: { id: myStore.id, createdAt: { gte: start, lt: end } },
        select: {
          _count: { select: { favoriteBy: true } },
        },
      });

      const {
        id,
        userId,
        name,
        address,
        detailAddress,
        phoneNumber,
        image,
        createdAt,
        content,
        updatedAt,
      } = myStore;
      const productCount = myStore._count.products;
      const favoriteCount = myStore._count.favoriteBy;
      const monthFavoriteCount = monthFavorite ? monthFavorite._count.favoriteBy : 0;
      const totalSoldCount = myStore.products.reduce(
        (a, c) => a + c.SalesLog.reduce((a2, c2) => a2 + c2.quantity, 0),
        0,
      );
      return {
        id,
        userId,
        name,
        address,
        detailAddress,
        phoneNumber,
        image,
        createdAt,
        content,
        updatedAt,
        productCount,
        favoriteCount,
        monthFavoriteCount,
        totalSoldCount,
      };
    });
  }

  public async myStoreProduct(dto: MyStoreProductDto & UserId): Promise<MyStoreProductResponse> {
    const { userId: loginId, page = 1, pageSize = 10 } = dto;
    return await this.prisma.$transaction(async (tx) => {
      const me = await tx.user.findUnique({ where: { id: loginId }, select: { id: true } });
      if (!me) throw new NotFoundException(StoreErrorMsg.NotFound);

      const myStore = await tx.store.findFirst({
        where: { userId: me.id },
        select: { id: true },
      });
      if (!myStore) throw new NotFoundException(StoreErrorMsg.NotFound);

      const productList = await tx.product.findMany({
        where: { storeId: myStore.id },
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        select: {
          id: true,
          image: true,
          name: true,
          price: true,
          stocks: true,
          discountStartTime: true,
          discountEndTime: true,
          createdAt: true,
          isSoldOut: true,
        },
      });
      if (!productList) throw new NotFoundException(ProductErrorMsg.NotFound);

      const list = productList.map((data) => {
        const { stocks, discountEndTime, discountStartTime, ...args } = data;
        const stock = stocks.reduce((a, c) => a + c.quantity, 0);
        let isDiscount = false;
        if (discountEndTime && discountStartTime) isDiscount = true;
        return { ...args, stock, isDiscount };
      });

      const totalCount = await tx.product.count({
        where: { storeId: myStore.id },
      });
      return { list, totalCount };
    });
  }

  /** 스토어 등록 */
  public async create(dto: CreateStoreDto & UserId): Promise<StoreResponse> {
    const { userId, name, address, phoneNumber, detailAddress } = dto;
    return await this.prisma.$transaction(async (tx: TxPrisma) => {
      const buyerValidation = await this.userService.txfindUser(tx, userId);
      if (buyerValidation && buyerValidation.type === 'BUYER')
        throw new BadRequestException('Buyer는 스토어를 등록할 수 없습니다.');
      const existing = await tx.store.findFirst({
        where: {
          userId,
          OR: [
            {}, // userId만 매칭
            { name, address, phoneNumber, detailAddress }, // 완전 동일 매칭
          ],
        },
      });
      if (existing) {
        const isExactSame =
          existing.name === name &&
          existing.address === address &&
          existing.phoneNumber === phoneNumber;

        throw new BadRequestException(isExactSame ? StoreErrorMsg.Exist : StoreErrorMsg.OneRegist);
      }
      return await tx.store.create({
        data: dto,
      });
    });
  }

  /** 스토어 수정 */
  public async update(dto: UpdateStoreNeedIdDto & UserId): Promise<StoreResponse> {
    const { id, name, address, detailAddress, content, phoneNumber, image, userId } = dto;

    return await this.prisma.$transaction(async (tx: TxPrisma) => {
      const user = await this.userService.txfindUser(tx, userId);
      const store = await this.txFindStore(tx, id);
      console.log(image);
      if (user.id !== store.userId) throw new ForbiddenException(AuthErrorMsg.Forbidden);

      const result = await tx.store.update({
        where: { id: store.id, userId: user.id },
        data: { name, address, phoneNumber, image, detailAddress, content },
      });
      return result;
    });
  }

  /** 관심 스토어 등록 */
  public async favorite(dto: FavoirteStoreDto): Promise<FavoriteStoreResponseDto> {
    const { storeId, userId } = dto;
    return await this.prisma.$transaction(async (tx: TxPrisma) => {
      const user = await this.userService.txfindUser(tx, userId);
      const store = await this.txFindStore(tx, storeId);
      if (user.id === store.userId)
        throw new BadRequestException(
          `본인의 스토어를 등록할 수 없습니다. ${StoreErrorMsg.BadRequest}`,
        );

      await tx.favoriteStore.create({
        data: {
          userId,
          storeId,
        },
      });

      return {
        type: 'register' as 'register' | 'delete',
        store,
      };
    });
  }

  /** 관심 스토어 해제 */
  public async favoriteDelete(dto: FavoirteStoreDto): Promise<FavoriteStoreResponseDto> {
    const { storeId, userId } = dto;
    const favorite = await this.prisma.favoriteStore.delete({
      where: {
        storeId_userId: {
          storeId,
          userId,
        },
      },
      include: {
        store: true,
      },
    });
    return {
      type: 'delete',
      store: favorite.store,
    };
  }
}
