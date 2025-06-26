import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { FindDashboardResponseDto } from './dto/reponse.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Cron } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';
const dateid = String(new Date());

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '대시보드 조회', description: '대시보드 정보를 조회합니다.' })
  @ApiOkResponse({ type: FindDashboardResponseDto, description: '대시보드 조회 성공' })
  async dashboard(@CurrentUser('sub') userId: string) {
    return this.dashboardService.find(userId);
  }

  @Post('run')
  @ApiExcludeEndpoint()
  @Public()
  @ApiOperation({ summary: '대시보드 실행 (development 전용)' })
  async runDashboard() {
    await this.dashboardService.createDailySummaryForAllStores();
    await this.dashboardService.createWeeklySummaryForAllStores();
    await this.dashboardService.createMonthlySummaryForAllStores();
    await this.dashboardService.createYearlySummaryForAllStores();
    return { message: '대시보드 실행 완료' };
  }

  @Cron('0 0 0 * * *', { name: dateid })
  async handleDailyCron() {
    this.logger.log('[Cron] 모든 매장의 일일 요약 생성 시작...');
    try {
      await this.dashboardService.createDailySummaryForAllStores();
      this.logger.log('[Cron] 모든 매장의 일일 요약 생성 완료.');
    } catch (error) {
      this.logger.error('[Cron] 일일 요약 생성 중 오류 발생', error);
    }
  }

  @Cron('0 0 * * 1', { name: dateid + '_week' }) // 매주 월요일 00:00
  async handleWeeklyCron() {
    this.logger.log('[Cron] 모든 매장의 주간 요약 생성 시작...');
    try {
      await this.dashboardService.createWeeklySummaryForAllStores();
      this.logger.log('[Cron] 모든 매장의 주간 요약 생성 완료.');
    } catch (error) {
      this.logger.error('[Cron] 주간 요약 생성 중 오류 발생', error);
    }
  }

  @Cron('0 0 1 * *', { name: dateid + '_month' }) // 매월 1일 00:00
  async handleMonthlyCron() {
    this.logger.log('[Cron] 모든 매장의 월간 요약 생성 시작...');
    try {
      await this.dashboardService.createMonthlySummaryForAllStores();
      this.logger.log('[Cron] 모든 매장의 월간 요약 생성 완료.');
    } catch (error) {
      this.logger.error('[Cron] 월간 요약 생성 중 오류 발생', error);
    }
  }

  @Cron('0 0 1 1 *', { name: dateid + '_year' }) // 매년 1월 1일 00:00
  async handleYearlyCron() {
    this.logger.log('[Cron] 모든 매장의 연간 요약 생성 시작...');
    try {
      await this.dashboardService.createYearlySummaryForAllStores();
      this.logger.log('[Cron] 모든 매장의 연간 요약 생성 완료.');
    } catch (error) {
      this.logger.error('[Cron] 연간 요약 생성 중 오류 발생', error);
    }
  }
}
