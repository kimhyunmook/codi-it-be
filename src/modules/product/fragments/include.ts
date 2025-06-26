import { Prisma } from '@prisma/client';

export const ProductInclude: Prisma.ProductInclude = {
  store: { select: { id: true, name: true } },
  stocks: {
    select: { id: true, quantity: true, size: { select: { id: true, name: true } } },
  },
  category: true,
  reviews: {
    include: {
      user: {
        select: {
          name: true,
          email: true,
          type: true,
          grade: true,
          points: true,
          image: true,
        },
      },
    },
  },
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
