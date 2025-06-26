/* eslint-disable @typescript-eslint/no-unused-vars */
import { PaymentStatus, Prisma, PrismaClient } from '@prisma/client';
import gradeData from './data/grade';
import { storeData } from './data/store';
import { categoryData } from './data/category';
import { cartData } from './data/cart';
import { orderData } from './data/order';
import { productData } from './data/product';
import { reviewData } from './data/review';
import { sizeData } from './data/size';
import { inquiryData } from './data/inquiry';
import buyerName from './data/buyerName';

const prisma = new PrismaClient();
const random = (target: any[]) => Math.floor(Math.random() * target.length);
const now = new Date();

const getRandomDateWithin30Days = () => {
  const offset = Math.floor(Math.random() * 61) - 30; // -30 ~ +30
  const randomDate = new Date();
  randomDate.setDate(now.getDate() + offset);
  return randomDate;
};

const MIN_PRICE = 5000;
const MAX_PRICE = 300000;

const getRandomPrice = () => {
  const minUnit = MIN_PRICE / 100; // 50
  const maxUnit = MAX_PRICE / 100; // 3000

  const randomUnit = Math.floor(Math.random() * (maxUnit - minUnit + 1)) + minUnit;
  return randomUnit * 100;
};

async function CreateSeed() {
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

      const buyers = Array.from({ length: 29 }).map((_, i): Prisma.UserCreateManyInput => {
        return {
          name: buyerName[i].name,
          email: `buyer${i}@codiit.com`,
          password: '$2b$10$ntrEvGluJUWdjP3tAALiX.9/iTiQzSY/yrBoEdZBtoufgpcxCHDAa',
          type: 'BUYER',
        };
      });
      buyers.push({
        name: '구매자',
        email: 'buyer@codiit.com',
        password: '$2b$10$ntrEvGluJUWdjP3tAALiX.9/iTiQzSY/yrBoEdZBtoufgpcxCHDAa',
        type: 'BUYER',
      });

      const buyer = await tx.user.createManyAndReturn({
        data: buyers,
      });

      // const testBuyer = buyer[buyer.length - 1];
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
            userId: buyer[buyer.length - 1].id,
          };
        }),
      });
      line('favoriteStore 테이블', favoriteStore.length);

      const product = await tx.product.createManyAndReturn({
        data: Array.from({ length: (store.length * productData.length) / 4 }).map(
          (): Prisma.ProductCreateManyInput => {
            const { categoryName, ...args } = productData[random(productData)];
            return {
              ...args,
              price: getRandomPrice(),
              storeId: store[random(store)].id,
              categoryId: category.find((x) => x.name === categoryName)!.id,
              createdAt: getRandomDateWithin30Days(),
              isSoldOut: random(Array.from({ length: 2 })) % 2 === 0 ? false : true,
            };
          },
        ),
      });
      line('product 테이블', product.length);

      const stock = await Promise.all(
        product.map(async (data) => {
          return Promise.all(
            Array.from({ length: random(size) }).map((_, i) =>
              tx.stock.create({
                data: {
                  productId: data.id,
                  sizeId: i + 1,
                  quantity: random(Array.from({ length: 30 })),
                },
              }),
            ),
          );
        }),
      );
      line('stock 테이블', stock.length);

      const inquiry = await tx.inquiry.createManyAndReturn({
        data: Array.from({ length: product.length * 4 }).map((): Prisma.InquiryCreateManyInput => {
          const inquryidx = random(inquiryData);
          const productidx = random(product);
          const buyeridx = random(buyer);

          return {
            title: inquiryData[inquryidx].title,
            content: inquiryData[inquryidx].content,
            userId: buyer[buyeridx].id,
            productId: product[productidx].id,
            isSecret: random(Array.from({ length: 2 })) % 2 === 0 ? true : false,
          };
        }),
        include: { product: { select: { store: { select: { userId: true } } } } },
      });
      line('inquiry 테이블', inquiry.length);

      const inquiriesToReply = Array.from({ length: inquiry.length / 4 }, (_, i) => inquiry[i]);
      const inquiriesUpdates: Promise<any>[] = [];
      const replyData = inquiriesToReply.map((data, i): Prisma.ReplyCreateManyInput => {
        if (i % 3 === 0)
          inquiriesUpdates.push(
            tx.inquiry.update({
              where: { id: data.id },
              data: { status: 'CompletedAnswer' },
            }),
          );

        return {
          inquiryId: data.id,
          content: `${data.title}의 답변 입니다.`,
          userId: data.product.store.userId,
          createdAt: getRandomDateWithin30Days(),
        };
      });
      await Promise.all(inquiriesUpdates);
      const reply = await tx.reply.createManyAndReturn({ data: replyData });
      line('reply 테이블 ', reply.length);

      const order = await tx.order.createManyAndReturn({
        data: Array.from({ length: buyer.length * 5 }).map((): Prisma.OrderCreateManyInput => {
          const idx = random(orderData);
          const user = buyer[random(buyers)];
          return {
            userId: user.id,
            name: user.name,
            phoneNumber: orderData[idx].phoneNumber,
            address: orderData[idx].address,
            subtotal: orderData[idx].subtotal,
            createdAt: getRandomDateWithin30Days(),
          };
        }),
      });
      line('order 테이블', order.length);

      const orderItem = await tx.orderItem.createManyAndReturn({
        data: Array.from({ length: order.length * 3 }).map((): Prisma.OrderItemCreateManyInput => {
          const orderidx = random(order);
          const productidx = random(product);
          const sizeidx = random(size);
          const quantity = random(Array.from({ length: 25 })) + 1;
          return {
            productId: product[productidx].id,
            orderId: order[orderidx].id,
            sizeId: size[sizeidx].id,
            price: product[productidx].price * quantity,
            quantity,
          };
        }),
      });
      line('orderItem 테이블', orderItem.length);

      const review = await tx.review.createManyAndReturn({
        data: orderItem.map((data): Prisma.ReviewCreateManyInput => {
          const reviewidx = random(reviewData);
          const rating = random(Array.from({ length: 5 })) + 1;

          return {
            userId: order.find((x) => x.id === data.orderId)!.userId,
            productId: data.productId,
            orderItemId: data.id,
            content: reviewData[reviewidx].content,
            rating,
            createdAt: getRandomDateWithin30Days(),
          };
        }),
      });
      const findProduct = await tx.product.findMany({
        select: { id: true, reviews: { select: { rating: true } } },
      });
      await Promise.all(
        findProduct.map((data) => {
          const { id, reviews } = data;
          const reviewsRating =
            reviews.length > 0 ? reviews.reduce((a, c) => a + c.rating, 0) / reviews.length : 0;
          return tx.product.update({ where: { id }, data: { reviewsRating } });
        }),
      );
      line('review 테이블', review.length);

      const cart = await tx.cart.createManyAndReturn({
        data: cartData.map(
          (): Prisma.CartCreateManyInput => ({
            buyerId: buyer[buyer.length - 1].id,
          }),
        ),
      });
      line('cart 테이블', cart.length);

      const payment = await tx.payment.createManyAndReturn({
        data: order.map((data, i): Prisma.PaymentCreateManyInput => {
          let status: PaymentStatus = PaymentStatus.WaitingPayment;
          switch (i % 3) {
            case 0:
              status = PaymentStatus.WaitingPayment;
              break;
            case 1:
              status = PaymentStatus.CompletedPayment;
              break;
            case 2:
              status = PaymentStatus.CancelledPayment;
              break;
          }
          return {
            orderId: data.id,
            price: data.subtotal - data.usePoint,
            status,
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

      const complteProducts = await tx.payment.findMany({
        where: { status: 'CompletedPayment' },
        select: {
          updatedAt: true,
          order: {
            select: { userId: true, orderItems: { select: { product: true, quantity: true } } },
          },
        },
      });
      const saleLogData = complteProducts
        .map((data) =>
          data.order.orderItems.map((item): Prisma.SalesLogCreateManyInput => {
            return {
              userId: data.order.userId,
              productId: item.product.id,
              storeId: item.product.storeId,
              price: item.product.price * item.quantity,
              quantity: item.quantity,
              soldAt: data.updatedAt,
            };
          }),
        )
        .flat();

      const saleLog = await tx.salesLog.createManyAndReturn({
        data: saleLogData,
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
// void CreateSeed();

async function UpdateSeed() {
  await prisma.$transaction(async (tx) => {
    const find = await tx.product.findMany();

    await Promise.all(
      find.map((data) => {
        const productInfo = productData.find((x) => x.name === data.name);
        if (!productInfo) return Promise.resolve();
        return tx.product.update({
          where: { id: data.id, name: productInfo.name },
          data: {
            content: productInfo.content,
          },
        });
      }),
    );
  });
  line('product 테이블 업데이트');
}
// void UpdateSeed();

// async function AddSeed() {
//   //favoirte buyer@codiit.com
//   await prisma.$transaction(async (tx) => {
//     const buyerCodiit = await tx.user.findFirst({
//       where: {
//         email: 'buyer@codiit.com',
//       },
//       select: { id: true },
//     });
//     const store = await tx.store.findMany();

//     if (!buyerCodiit || !store) return console.log('에러');
//     await tx.favoriteStore.deleteMany({ where: { userId: buyerCodiit.id } });

//     await Promise.all(
//       store.map((v) =>
//         tx.favoriteStore.create({ data: { userId: buyerCodiit.id, storeId: v.id } }),
//       ),
//     );
//   });
// }

// void AddSeed();

const line = (text: string, text2?: string | number) => {
  console.log(`✅ ${text}`, text2);
  console.log('----------------------------');
};
