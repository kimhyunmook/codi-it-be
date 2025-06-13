import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UserErrorMsg } from './constants/mesasge';
import { TxPrisma, UserId } from 'src/types/common';
import { hash } from 'bcrypt';
import { LikesStoreResponse, UserResponse } from './dto/response';

const saltRounds = 10;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  public async txfindUser(tx: TxPrisma, userId: UserId['userId']): Promise<UserResponse> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: {
        grade: true,
        favoriteStores: { select: { store: true } },
      },
    });
    if (!user) throw new NotFoundException(UserErrorMsg.NotFound);
    return user;
  }

  public async create(dto: CreateUserDto): Promise<UserResponse> {
    const { name, email, password, type, image } = dto;
    try {
      const hashPw = await hash(password, saltRounds);
      const user = await this.prisma.user.create({
        data: { name, email, password: hashPw, type, image },
        include: { grade: true },
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
    const { userId, name, password } = dto;
    return await this.prisma.$transaction(async (tx: TxPrisma) => {
      const existUser = await this.txfindUser(tx, userId);

      const result = await tx.user.update({
        where: { id: existUser.id },
        data: {
          name: name ?? existUser.name,
          password: password ?? existUser.password,
        },
        include: { grade: true },
      });
      return result;
    });
  }

  public async getLikedStores(userId: UserId['userId']): Promise<LikesStoreResponse[]> {
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

  public async deleteUser(userId: string): Promise<UserResponse> {
    return await this.prisma.$transaction(async (tx: TxPrisma) => {
      const user = await this.txfindUser(tx, userId);
      const result = await tx.user.delete({ where: { id: user.id } });
      return result;
    });
  }
}
