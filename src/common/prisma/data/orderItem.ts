import { OrderItem } from '@prisma/client';

export const orderItemData: OrderItem[] = [
  {
    id: 'orderItem1',
    orderId: 'order1',
    productId: 'product1',
    sizeId: 1,
    price: 25000,
    quantity: 1,
    isReviewed: true,
  },
  {
    id: 'orderItem2',
    orderId: 'order1',
    productId: 'product2',
    sizeId: 2,
    price: 30000,
    quantity: 2,
    isReviewed: false,
  },
  {
    id: 'orderItem3',
    orderId: 'order2',
    productId: 'product3',
    sizeId: 3,
    price: 18000,
    quantity: 1,
    isReviewed: true,
  },
  {
    id: 'orderItem4',
    orderId: 'order2',
    productId: 'product4',
    sizeId: 1,
    price: 35000,
    quantity: 1,
    isReviewed: false,
  },
  {
    id: 'orderItem5',
    orderId: 'order3',
    productId: 'product5',
    sizeId: 2,
    price: 22000,
    quantity: 1,
    isReviewed: true,
  },
];
