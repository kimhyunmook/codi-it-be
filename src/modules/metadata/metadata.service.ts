import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class MetadataService {
  constructor(private readonly prisma: PrismaService) {}

  public async getSize() {
    return this.prisma.size.findMany();
  }

  public async getCategory(target: string) {
    if (!target) return this.prisma.category.findMany();

    return this.prisma.category.findMany({
      where: { name: target },
    });
  }

  public async getGrade() {
    return this.prisma.grade.findMany();
  }
}
