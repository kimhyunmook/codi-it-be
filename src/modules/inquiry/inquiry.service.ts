import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInquiryReplyServiceDto, CreateInquiryServiceDto } from './dto/create-inquiry.dto';
import { UserId } from 'src/types/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ProductErrorMsg } from '../product/constants/message';
import { FindInquiryServiceDto, FindMyInquiriesDto } from './dto/find-inquiry.dto';
import { UpdateInquiryReplyServiceDto, UpdateInquiryServiceDto } from './dto/update-inquiry.dto';
import { InquiriesErrorMsg } from './constants/message';
import { StoreErrorMsg } from '../store/constants/message';
import { InquiryResponse } from './dto/response';
import { UserErrorMsg } from '../user/constants/mesasge';

@Injectable()
export class InquiryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInquiryServiceDto & UserId): Promise<InquiryResponse> {
    const { userId, productId, title, content, isSecret } = dto;
    return await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
      });
      if (!product) throw new NotFoundException(ProductErrorMsg.NotFound);

      const result = await tx.inquiry.create({
        data: { userId, productId, title, content, isSecret },
      });
      return result;
    });
  }

  public async findOne(inquiryId: string): Promise<InquiryResponse> {
    const result = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        reply: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: { select: { name: true, id: true } },
          },
        },
      },
    });
    if (!result) throw new NotFoundException(InquiriesErrorMsg.NotFound);
    return result;
  }

  public async findAll(dto: FindInquiryServiceDto) {
    const { productId, page = 1, pageSize = 10 } = dto;

    return await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });
      if (!product) throw new NotFoundException(StoreErrorMsg.NotFound);
      const targetId = product.id;
      const inquiries = await tx.inquiry.findMany({
        where: { productId: targetId },
        include: {
          reply: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      const totalCount = await tx.inquiry.count({ where: { productId: targetId } });
      return {
        list: inquiries,
        totalCount,
      };
    });
  }

  public async myInquiries(dto: FindMyInquiriesDto, userId: UserId['userId']) {
    const { page = 1, pageSize = 10, status } = dto;
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, type: true },
      });
      if (!user) throw new NotFoundException(UserErrorMsg.NotFound);
      let inquiries = await tx.inquiry.findMany({
        where: { userId, ...(status ? { status } : {}) },
        select: {
          id: true,
          title: true,
          isSecret: true,
          status: true,
          product: {
            select: {
              id: true,
              name: true,
              image: true,
              store: { select: { id: true, name: true } },
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      if (user.type === 'SELLER') {
        inquiries = await tx.inquiry.findMany({
          where: {
            ...(status ? { status } : {}),
            product: {
              store: {
                userId: user.id,
              },
            },
          },
          select: {
            id: true,
            title: true,
            isSecret: true,
            status: true,
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                store: { select: { id: true, name: true } },
              },
            },
          },
        });
      }
      const totalCount = await tx.inquiry.count({
        where: { userId: user.id, ...(status ? { status } : {}) },
      });
      return { list: inquiries, totalCount };
    });
  }

  public async update(dto: UpdateInquiryServiceDto & UserId): Promise<InquiryResponse> {
    const { inquiryId, userId, title, content, isSecret } = dto;

    return await this.prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.findUnique({
        where: { id: inquiryId, userId },
      });
      if (!inquiry) throw new NotFoundException(InquiriesErrorMsg.NotFound);

      const result = await tx.inquiry.update({
        where: { id: inquiryId },
        data: {
          title: title ?? inquiry.title,
          content: content ?? inquiry.content,
          isSecret: isSecret ?? inquiry.isSecret,
        },
      });
      return result;
    });
  }

  public async deleteInquiry(inquiryId: string): Promise<InquiryResponse> {
    return await this.prisma.inquiry.delete({
      where: { id: inquiryId },
    });
  }

  public async replyCreate(dto: CreateInquiryReplyServiceDto) {
    const { userId, inquiryId, content } = dto;
    return await this.prisma.$transaction(async (tx) => {
      const inquiry = await tx.inquiry.findUnique({
        where: { id: inquiryId },
      });
      if (!inquiry) throw new NotFoundException(InquiriesErrorMsg.NotFound);

      return await tx.reply.create({
        data: { userId, inquiryId: inquiry.id, content },
      });
    });
  }

  public async replyUpdate(dto: UpdateInquiryReplyServiceDto) {
    const { replyId, userId, content } = dto;
    return await this.prisma.$transaction(async (tx) => {
      const reply = await tx.reply.findUnique({
        where: { id: replyId, userId },
      });
      if (!reply) throw new NotFoundException(InquiriesErrorMsg.NotFoundRePly);

      return await tx.reply.update({
        where: { id: replyId, userId },
        data: { content },
      });
    });
  }

  public async findOneReply(replyId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const result = await tx.reply.findUnique({
        where: { id: replyId },
      });
      if (!result) throw new NotFoundException(InquiriesErrorMsg.NotFoundRePly);
      return result;
    });
  }
}
