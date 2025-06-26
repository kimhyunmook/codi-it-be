import { Prisma } from '@prisma/client';

export const UserSelect: Prisma.UserSelect = {
  id: true,
  name: true,
  email: true,
  password: true,
  type: true,
  points: true,
  createdAt: true,
  updatedAt: true,
  image: true,
  grade: true,
};
