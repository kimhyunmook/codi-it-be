import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UserErrorMsg } from './constants/mesasge';
import { TxPrisma, UserId } from 'src/types/common';
import { compare, hash } from 'bcrypt';
import { LikeStoreResponse, UserResponse } from './dto/response';
import { saltRounds } from './constants/hash';
import { UserSelect } from './fragments/select';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  public async txfindUser(tx: TxPrisma, userId: UserId['userId']): Promise<UserResponse> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: UserSelect,
    });
    if (!user) throw new NotFoundException(UserErrorMsg.NotFound);
    return user;
  }

  public async create(dto: CreateUserDto): Promise<UserResponse> {
    const { name, email, password, type } = dto;
    try {
      const hashPw = await hash(password, saltRounds);
      const user = await this.prisma.user.create({
        data: { name, email, password: hashPw, type },
        select: UserSelect,
      });
      return user;
    } catch (error) {
      if (error.status === 409) throw new ConflictException(UserErrorMsg.Conflict);
      return error;
    }
  }

  public async findMe(userId: UserId['userId']): Promise<UserResponse> {
    return await this.prisma.$transaction(async (tx: TxPrisma) => {
      const result = await this.txfindUser(tx, userId);
      if (!result) throw new NotFoundException(UserErrorMsg.NotFound);
      return result;
    });
  }

  public async updateMe(dto: UpdateUserDto & UserId): Promise<UserResponse> {
    const { userId: id, name, password, currentPassword, image } = dto;
    return await this.prisma.$transaction(async (tx: TxPrisma) => {
      const existUser = await tx.user.findUnique({
        where: { id },
        select: { id: true, password: true, name: true, image: true },
      });
      if (!existUser) throw new NotFoundException(UserErrorMsg.NotFound);

      const checkPassword = await compare(currentPassword, existUser.password);
      if (!checkPassword) throw new UnauthorizedException(UserErrorMsg.NotComparePW);
      let hashPw = existUser.password;
      if (password) hashPw = await hash(password, saltRounds);

      return await tx.user.update({
        where: { id: existUser.id },
        data: {
          name: name ?? existUser.name,
          password: hashPw,
          image: image ?? existUser.image,
        },
        select: UserSelect,
      });
    });
  }

  public async getLikedStores(userId: UserId['userId']): Promise<LikeStoreResponse[]> {
    return await this.prisma.$transaction(async (tx: TxPrisma) => {
      const user = await this.txfindUser(tx, userId);
      const likes = await tx.favoriteStore.findMany({
        where: { userId: user.id },
        select: {
          store: true,
        },
      });

      return likes;
    });
  }

  public async deleteUser(userId: UserId['userId']): Promise<UserResponse> {
    return await this.prisma.$transaction(async (tx: TxPrisma) => {
      const user = await this.txfindUser(tx, userId);
      return await tx.user.delete({ where: { id: user.id } });
    });
  }
}
