import { PaymentStatus } from '@prisma/client';

export const paymentData = [
  {
    price: 85000,
    status: PaymentStatus.CompletedPayment,
    createdAt: new Date('2025-05-01T10:00:00Z'),
    updatedAt: new Date('2025-05-01T10:00:00Z'),
  },
  {
    price: 53000,
    status: PaymentStatus.WaitingPayment,
    createdAt: new Date('2025-05-02T15:30:00Z'),
    updatedAt: new Date('2025-05-02T15:30:00Z'),
  },
  {
    price: 20000,
    status: PaymentStatus.CancelledPayment,
    createdAt: new Date('2025-05-03T09:20:00Z'),
    updatedAt: new Date('2025-05-03T09:20:00Z'),
  },
];
