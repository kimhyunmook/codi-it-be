import { Prisma, PrismaClient } from '@prisma/client';
import gradeData from './data/grade';
import { storeData } from './data/store';
import { categoryData } from './data/category';
import { cartData } from './data/cart';
import { orderData } from './data/order';
import { productData } from './data/product';
import { reviewData } from './data/review';
import { sizeData } from './data/size';
import { orderItemData } from './data/orderItem';
import { paymentData } from './data/payment';
import { inquiryData } from './data/inquiry';

const prisma = new PrismaClient();
const random = (target: any[]) => Math.floor(Math.random() * target.length);
const now = new Date();

async function PrismaSeed() {
  const timeTxt = '걸린시간';
  console.time(timeTxt);
  console.log('🎉 Seed 시작');
  try {
    await prisma.$transaction([
      prisma.orderItem.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.order.deleteMany(),
      prisma.cartItem.deleteMany(),
      prisma.cart.deleteMany(),
      prisma.review.deleteMany(),
      prisma.stock.deleteMany(),
      prisma.product.deleteMany(),
      prisma.size.deleteMany(),
      prisma.$executeRawUnsafe(`TRUNCATE TABLE "Size" RESTART IDENTITY CASCADE`),
      prisma.store.deleteMany(),
      prisma.user.deleteMany(),
      prisma.grade.deleteMany(),
      prisma.category.deleteMany(),
      prisma.$executeRawUnsafe(`TRUNCATE TABLE "Category" RESTART IDENTITY CASCADE`),
      prisma.salesLog.deleteMany(),
    ]);
    console.log('🔥 모든 테이블 초기화');
    console.log('----------------------------');

    await prisma.$transaction(async (tx) => {
      const category = await tx.category.createManyAndReturn({
        data: categoryData,
      });
      line('category 테이블', category.length);

      const grade = await tx.grade.createManyAndReturn({
        data: gradeData,
      });
      line('grade 테이블', grade.length);

      const size = await tx.size.createManyAndReturn({
        data: sizeData,
      });
      line('size 테이블', size.length);

      const seller = await tx.user.createManyAndReturn({
        data: Array.from({ length: storeData.length }).map((_, i): Prisma.UserCreateManyInput => {
          return {
            name: `판매자 ${i}`,
            email: `seller${i}@codiit.com`,
            password: '$2b$10$ntrEvGluJUWdjP3tAALiX.9/iTiQzSY/yrBoEdZBtoufgpcxCHDAa',
            type: 'SELLER',
          };
        }),
      });
      const buyer = await tx.user.createManyAndReturn({
        data: [
          {
            name: '구매자',
            email: 'buyer@codiit.com',
            password: '$2b$10$ntrEvGluJUWdjP3tAALiX.9/iTiQzSY/yrBoEdZBtoufgpcxCHDAa',
            type: 'BUYER',
          },
        ],
      });
      line('user 테이블', seller.length + buyer.length);

      const store = await tx.store.createManyAndReturn({
        data: seller.map((user, i) => {
          return {
            ...storeData[i],
            userId: user.id,
          };
        }),
      });
      line('store 테이블', store.length);

      const favoriteStore = await tx.favoriteStore.createManyAndReturn({
        data: Array.from({ length: 7 }).map((_, i): Prisma.FavoriteStoreCreateManyInput => {
          return {
            storeId: store[i].id,
            userId: buyer[0].id,
          };
        }),
      });
      line('favoriteStore 테이블', favoriteStore.length);

      const product = await tx.product.createManyAndReturn({
        data: Array.from({ length: store.length * productData.length }).map(() => {
          return {
            ...productData[random(productData)],
            storeId: store[random(store)].id,
            categoryId: category[random(category)].id,
          };
        }),
      });
      line('product 테이블', product.length);

      const inquiry = await tx.inquiry.createManyAndReturn({
        data: Array.from({ length: product.length }).map((): Prisma.InquiryCreateManyInput => {
          const inquryidx = random(inquiryData);
          const productidx = random(product);
          return {
            title: inquiryData[inquryidx].title,
            content: inquiryData[inquryidx].content,
            userId: buyer[0].id,
            productId: product[productidx].id,
          };
        }),
        include: { product: { select: { store: { select: { userId: true } } } } },
      });
      line('inquiry 테이블', inquiry.length);

      const reply = await tx.reply.createManyAndReturn({
        data: Array.from({ length: inquiry.length / 2 }, (_, i) => inquiry[i]).map(
          (data): Prisma.ReplyCreateManyInput => {
            return {
              inquiryId: data.id,
              content: data.title + '의 답변 입니다.',
              userId: data.product.store.userId,
            };
          },
        ),
      });
      line('line 테이블 ', reply.length);

      const order = await tx.order.createManyAndReturn({
        data: orderData.map((data, i) => {
          return {
            userId: buyer[0].id,
            name: buyer[0].name,
            phoneNumber: orderData[i].phoneNumber,
            address: orderData[i].address,
            totalQuantity: orderData[i].totalQuantity,
            subtotal: orderData[i].subtotal,
          };
        }),
      });
      line('order 테이블', order.length);

      const cart = await tx.cart.createManyAndReturn({
        data: cartData.map(
          (): Prisma.CartCreateManyInput => ({
            buyerId: buyer[0].id,
          }),
        ),
      });
      line('cart 테이블', cart.length);

      const payment = await tx.payment.createManyAndReturn({
        data: order.map((data, i): Prisma.PaymentCreateManyInput => {
          return {
            orderId: data.id,
            price: paymentData[i].price,
          };
        }),
      });
      line('payment 테이블', payment.length);

      const cartItem = await tx.cartItem.createManyAndReturn({
        data: Array.from({ length: 6 }).map((): Prisma.CartItemCreateManyInput => {
          const prdidx = random(product);
          const sizeidx = random(size);
          return {
            cartId: cart[random(cart)].id,
            productId: product[prdidx].id,
            sizeId: size[sizeidx].id,
            quantity: random(Array.from({ length: 10 })),
          };
        }),
      });
      line('cartItem 테이블', cartItem.length);

      const orderItem = await tx.orderItem.createManyAndReturn({
        data: orderItemData.map((): Prisma.OrderItemCreateManyInput => {
          const orderidx = random(order);
          const productidx = random(product);
          const sizeidx = random(size);

          return {
            orderId: order[orderidx].id,
            productId: product[productidx].id,
            sizeId: size[sizeidx].id,
            price: product[productidx].price,
          };
        }),
      });
      line('orderItem 테이블', orderItem.length);

      const review = await tx.review.createManyAndReturn({
        data: reviewData.map((data, i): Prisma.ReviewCreateManyInput => {
          const idx = i % orderItem.length; // 순환을 위해 모듈러 연산 사용

          return {
            ...data,
            productId: orderItem[idx].productId,
            userId: buyer[0].id,
            orderItemId: orderItem[idx].id,
          };
        }),
      });
      line('review 테이블', review.length);

      const stock = await tx.stock.createManyAndReturn({
        data: product.map((data): Prisma.StockCreateManyInput => {
          const sizeidx = random(size);
          return {
            productId: data.id,
            sizeId: size[sizeidx].id,
            quantity: random(Array.from({ length: 30 })),
          };
        }),
      });
      line('stock 테이블', stock.length);

      const saleLog = await tx.salesLog.createManyAndReturn({
        data: Array.from({ length: product.length }, (_, i) => i).map((c, index) => {
          const quantity = Math.floor(Math.random() * 10 + 1);
          const idx = random(store);
          const productidx = random(product);

          return {
            productId: product[productidx].id,
            price: product[productidx].price * quantity,
            quantity,
            userId: store[idx].userId,
            storeId: store[idx].id,
            soldAt:
              index < 5
                ? new Date()
                : new Date(
                    now.setDate(now.getDate() + Math.floor(Math.random() * 30 - 15)) +
                      Math.floor(Math.random() * 24) * 60 * 60 * 1000,
                  ),
          };
        }),
      });
      line('salesLog 테이블', saleLog.length);
    });

    console.log('🚀 Seed 완료');
  } catch (e) {
    console.error('PrismaSeed 실행 중 오류 발생', e);
  } finally {
    console.timeEnd(timeTxt);
    await prisma.$disconnect();
  }
}
void PrismaSeed();

const line = (text: string, text2: string | number) => {
  console.log(`✅ ${text}`, text2);
  console.log('----------------------------');
};
