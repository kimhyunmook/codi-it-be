import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { StoreErrorMsg } from '../store/constants/message';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
} from 'date-fns';
import { SalesLog } from './dto/reponse.dto';
import { UserId } from 'src/types/common';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async find(userId: UserId['userId']) {
    const now = new Date();

    // 오늘
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // 이번 주
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // 이번 달
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // 이번 년
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    return await this.prisma.$transaction(async (tx) => {
      const store = await tx.store.findFirst({
        where: { userId },
        select: { id: true },
      });
      if (!store) throw new NotFoundException(StoreErrorMsg.NotFound);
      const storeId = store.id;

      // 오늘 매출
      const todayLogs = await tx.salesLog.findMany({
        where: {
          storeId,
          soldAt: { gte: todayStart, lte: todayEnd },
        },
        select: { price: true, quantity: true },
      });

      // 어제 매출 로그
      const previousTodayLogs = await tx.dailyStoreSales.findFirst({
        select: {
          totalOrders: true,
          totalSales: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      // 이번 주 매출
      const weekLogs = await tx.salesLog.findMany({
        where: {
          storeId,
          soldAt: { gte: weekStart, lte: weekEnd },
        },
        select: { price: true, quantity: true },
      });

      // 저번 주 매출 로그
      const previousWeekLogs = await tx.weeklyStoreSales.findFirst({
        select: { totalOrders: true, totalSales: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      // 이번 달 매출
      const monthLogs = await tx.salesLog.findMany({
        where: {
          storeId,
          soldAt: { gte: monthStart, lte: monthEnd },
        },
        select: { price: true, quantity: true },
      });

      // 저번 달 매출 로그
      const previousMonthLogs = await tx.monthlyStoreSales.findFirst({
        select: { totalOrders: true, totalSales: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      // 이번 년 매출
      const yearLogs = await tx.salesLog.findMany({
        where: {
          storeId,
          soldAt: { gte: yearStart, lte: yearEnd },
        },
        select: { price: true, quantity: true },
      });

      // 저번 년 매출 로그
      const previousYearLogs = await tx.yearlyStoreSales.findFirst({
        select: { totalOrders: true, totalSales: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      // 집계 함수
      const sumMetrics = (logs: { price: number; quantity: number }[]): SalesLog => {
        return logs.reduce(
          (acc, cur) => ({
            totalOrders: acc.totalOrders + cur.quantity,
            totalSales: acc.totalSales + cur.price,
          }),
          { totalOrders: 0, totalSales: 0 },
        );
      };

      // 매출 집계 퍼센트
      const todaySum = sumMetrics(todayLogs);
      const weekSum = sumMetrics(weekLogs);
      const monthSum = sumMetrics(monthLogs);
      const yearSum = sumMetrics(yearLogs);

      const changeRate = (current: SalesLog, previous: SalesLog | null): SalesLog => {
        let sales = 0;
        let orders = 0;
        if (previous === null || !current) return { totalSales: 0, totalOrders: 0 };

        if (previous.totalSales > 0) {
          sales = Math.round(
            ((current.totalSales - previous.totalSales) / previous.totalSales) * 100,
          );
          orders = Math.round(
            ((current.totalOrders - previous.totalOrders) / previous.totalOrders) * 100,
          );
        } else if (current.totalSales > 0) {
          sales = 100;
          orders = 100;
        }

        return { totalOrders: orders, totalSales: sales };
      };
      const toDayChangeRate = changeRate(todaySum, previousTodayLogs);
      const weekChangeRate = changeRate(weekSum, previousWeekLogs);
      const monthChageRate = changeRate(monthSum, previousMonthLogs);
      const yearChangeRate = changeRate(yearSum, previousYearLogs);

      // 많이 판매된 상품 top5 조회
      const topSales = await tx.salesLog.groupBy({
        by: ['productId'],
        where: {
          storeId,
        },
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 5,
      });

      const topProducts = await tx.product.findMany({
        where: {
          id: { in: topSales.map((sale) => sale.productId!) },
        },
        select: {
          id: true,
          name: true,
          price: true,
        },
      });

      const priceRange = await this.getSalesByPriceRange(storeId);

      return {
        today: { current: todaySum, previous: previousTodayLogs, chageRate: toDayChangeRate },
        week: { current: weekSum, previous: previousWeekLogs, chageRate: weekChangeRate },
        month: { current: monthSum, previous: previousMonthLogs, changeRate: monthChageRate },
        year: { current: yearSum, previous: previousYearLogs, chageRate: yearChangeRate },
        topSales: topSales.map((sale) => {
          const productId = sale.productId;
          return {
            totalOrders: sale._sum.quantity,
            prodcuts: topProducts.find((prodcut) => prodcut.id === productId) ?? null,
          };
        }),
        priceRange,
      };
    });
  }

  private async createDailySummaryForStore(storeId: string, date: Date) {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException(StoreErrorMsg.NotFound);

    const logs = await this.prisma.salesLog.findMany({
      where: {
        storeId,
        soldAt: { gte: dayStart, lte: dayEnd },
      },
      select: { price: true, quantity: true },
    });

    const totalOrders = logs.length;
    const totalSales = logs.reduce((sum, log) => sum + log.price * log.quantity, 0);

    await this.prisma.dailyStoreSales.upsert({
      where: { storeId_date: { storeId, date: dayStart } },
      update: { totalSales, totalOrders },
      create: { storeId, date: dayStart, totalSales, totalOrders },
    });
  }

  async createDailySummaryForAllStores() {
    const yesterday = subDays(new Date(), 1);
    const targetDate = startOfDay(yesterday);

    const stores = await this.prisma.store.findMany({ select: { id: true } });
    for (const { id: storeId } of stores) {
      await this.createDailySummaryForStore(storeId, targetDate);
    }
  }

  private async createWeeklySummaryForStore(storeId: string, date: Date) {
    // 이번 주(월요일 시작)
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException(StoreErrorMsg.NotFound);

    const logs = await this.prisma.salesLog.findMany({
      where: {
        storeId,
        soldAt: { gte: weekStart, lte: weekEnd },
      },
      select: { price: true, quantity: true },
    });

    const totalOrders = logs.length;
    const totalSales = logs.reduce((sum, log) => sum + log.price * log.quantity, 0);

    const year = weekStart.getFullYear();
    const weekNumber =
      Math.ceil(
        (weekStart.getTime() - startOfYear(weekStart).getTime()) / (7 * 24 * 60 * 60 * 1000),
      ) + 1; // ISO week 간단 계산 방식

    await this.prisma.weeklyStoreSales.upsert({
      where: { storeId_year_week: { storeId, year, week: weekNumber } },
      update: { totalSales, totalOrders },
      create: { storeId, year, week: weekNumber, totalSales, totalOrders },
    });
  }

  async createWeeklySummaryForAllStores() {
    const lastWeekDate = subWeeks(new Date(), 1);
    for (const { id: storeId } of await this.prisma.store.findMany({ select: { id: true } })) {
      await this.createWeeklySummaryForStore(storeId, lastWeekDate);
    }
  }

  private async createMonthlySummaryForStore(storeId: string, date: Date) {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException(StoreErrorMsg.NotFound);

    const logs = await this.prisma.salesLog.findMany({
      where: {
        storeId,
        soldAt: { gte: monthStart, lte: monthEnd },
      },
      select: { price: true, quantity: true },
    });

    const totalOrders = logs.length;
    const totalSales = logs.reduce((sum, log) => sum + log.price * log.quantity, 0);

    const year = monthStart.getFullYear();
    const month = monthStart.getMonth() + 1; // 1~12

    await this.prisma.monthlyStoreSales.upsert({
      where: { storeId_year_month: { storeId, year, month } },
      update: { totalSales, totalOrders },
      create: { storeId, year, month, totalSales, totalOrders },
    });
  }

  async createMonthlySummaryForAllStores() {
    const lastMonthDate = subMonths(new Date(), 1);
    for (const { id: storeId } of await this.prisma.store.findMany({ select: { id: true } })) {
      await this.createMonthlySummaryForStore(storeId, lastMonthDate);
    }
  }

  private async createYearlySummaryForStore(storeId: string, date: Date) {
    const yearStart = startOfYear(date);
    const yearEnd = endOfYear(date);

    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException(StoreErrorMsg.NotFound);

    const logs = await this.prisma.salesLog.findMany({
      where: {
        storeId,
        soldAt: { gte: yearStart, lte: yearEnd },
      },
      select: { price: true, quantity: true },
    });

    const totalOrders = logs.length;
    const totalSales = logs.reduce((sum, log) => sum + log.price * log.quantity, 0);

    const year = yearStart.getFullYear();

    await this.prisma.yearlyStoreSales.upsert({
      where: { storeId_year: { storeId, year } },
      update: { totalSales, totalOrders },
      create: { storeId, year, totalSales, totalOrders },
    });
  }

  async createYearlySummaryForAllStores() {
    const lastYearDate = subYears(new Date(), 1);
    for (const { id: storeId } of await this.prisma.store.findMany({ select: { id: true } })) {
      await this.createYearlySummaryForStore(storeId, lastYearDate);
    }
  }

  /**
   * @param storeId 조회 대상 스토어 ID
   * @returns 가격대별 매출 합계와 비중을 계산한 배열
   */
  async getSalesByPriceRange(storeId: string) {
    return this.prisma.$transaction(async (tx) => {
      const priceRanges = [
        { range: '만원 이하', lt: 10000 },
        { range: '1만원~3만원', gte: 10000, lt: 30000 },
        { range: '3만원~5만원', gte: 30000, lt: 50000 },
        { range: '5만원~10만원', gte: 50000, lt: 100000 },
        { range: '10만원 이상', gte: 100000 },
      ];

      const store = await tx.store.findUnique({
        where: { id: storeId },
      });
      if (!store) throw new NotFoundException(StoreErrorMsg.NotFound);

      const salesLogs = await tx.salesLog.findMany({
        where: { storeId },
        select: {
          quantity: true,
          product: { select: { price: true } },
        },
      });
      const qtyByPrice: Record<number, number> = {};
      for (const { quantity, product } of salesLogs) {
        const price = product!.price ?? 0;
        if (!qtyByPrice[price]) {
          qtyByPrice[price] = 0;
        }
        qtyByPrice[price] += quantity;
      }

      interface RangeResult {
        priceRange: string;
        totalSales: number;
      }
      const rangeResults: RangeResult[] = priceRanges.map(({ range, lt, gte }) => {
        let total = 0;
        for (const [priceStr, qtySum] of Object.entries(qtyByPrice)) {
          const priceVal = Number(priceStr);
          const inRange =
            (lt !== undefined ? priceVal < lt : true) &&
            (gte !== undefined ? priceVal >= gte : true);
          if (inRange) {
            total += priceVal * qtySum;
          }
        }
        return { priceRange: range, totalSales: total };
      });

      const totalSalesAllRanges = rangeResults.reduce((acc, { totalSales }) => acc + totalSales, 0);

      const resultWithPercentage = rangeResults.map(({ priceRange, totalSales }) => {
        const percentage =
          totalSalesAllRanges > 0
            ? Math.round((totalSales / totalSalesAllRanges) * 10000) / 100
            : 0;
        return { priceRange, totalSales, percentage };
      });

      return resultWithPercentage;
    });
  }
}
