import { Controller, Get, Param, Patch, Sse } from '@nestjs/common';
import { AlarmService } from './alarm.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProduces } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AlarmDto } from './dto/alarm.dto';
import { SwaggerErrorExamples } from 'src/common/utils/swagger-error-response.util';
import { from, interval, map, mergeMap, Observable } from 'rxjs';
import { Alarm } from '@prisma/client';

interface ServerSentEvent<T> {
  data: T;
  id?: string;
  type?: string;
  retry?: number;
}

@ApiTags('Alarm')
@ApiBearerAuth()
@Controller('notifications')
export class AlarmController {
  constructor(private readonly alarmService: AlarmService) {}

  @ApiOperation({
    summary: '실시간 알람 SSE',
    description: '30초마다 실시간 알람을 SSE로 전송합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '실시간 알람 스트림',
    type: [AlarmDto],
  })
  @Sse('sse')
  @ApiProduces('text/event-stream')
  sse(@CurrentUser('sub') userId: string): Observable<ServerSentEvent<Alarm[]>> {
    return interval(30000).pipe(
      mergeMap(() =>
        from(this.alarmService.getUncheckedAlarms(userId)).pipe(
          map((alarms) => ({
            data: alarms,
          })),
        ),
      ),
    );
  }

  @Get()
  @ApiOperation({
    summary: '알람 조회(UserType에 따른 알람 조회)',
    description: '유저 타입에 따라 알람을 조회합니다',
  })
  @ApiResponse({ status: 200, description: '알람 목록 조회 성공', type: [AlarmDto] })
  @ApiResponse({
    status: 401,
    description: '인증 실패했습니다.',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiResponse({
    status: 404,
    description: '알람을 찾지 못했습니다.',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  @ApiResponse({
    status: 403,
    description: '사용자를 찾지 못했습니다',
    schema: { example: SwaggerErrorExamples.Forbidden },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청입니다',
    schema: { example: SwaggerErrorExamples.BadRequest },
  })
  async getAlarms(@CurrentUser('sub') userId: string) {
    return this.alarmService.getAlarmsByUser(userId);
  }

  @Patch(':alarmId/check')
  @ApiOperation({
    summary: '알람 읽음 처리',
    description: '알람을 읽음 처리합니다.',
  })
  @ApiResponse({ status: 200, description: '알람 읽음 처리 완료' })
  @ApiResponse({
    status: 401,
    description: '인증 실패했습니다',
    schema: { example: SwaggerErrorExamples.Unauthorized },
  })
  @ApiResponse({
    status: 404,
    description: '해당 알람이 없습니다.',
    schema: { example: SwaggerErrorExamples.NotFound },
  })
  @ApiResponse({
    status: 403,
    description: '사용자를 찾지 못했습니다',
    schema: { example: SwaggerErrorExamples.Forbidden },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청입니다',
    schema: { example: SwaggerErrorExamples.BadRequest },
  })
  async markAsChecked(@Param('alarmId') alarmId: string, @CurrentUser('sub') userId: string) {
    return this.alarmService.alarmAsChecked(alarmId, userId);
  }
}
