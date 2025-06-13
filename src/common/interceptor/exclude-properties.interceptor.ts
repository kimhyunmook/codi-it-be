import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EXCLUDE_PROPERTIES_KEY } from '../decorators/exclude-properties.decorator';

@Injectable()
export class ExcludePropertiesInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 컨트롤러 메서드에 선언된 제외할 프로퍼티 읽기
    const properties: string[] =
      this.reflector.get<string[]>(EXCLUDE_PROPERTIES_KEY, context.getHandler()) || [];

    return next.handle().pipe(map((data) => this.exclude(data, properties)));
  }

  private exclude(data: any, properties: string[]): any {
    if (!data || properties.length === 0) return data;

    // 배열인 경우 각 요소에 적용
    if (Array.isArray(data)) {
      return data.map((item) => this.exclude(item, properties));
    }

    // 객체 경우 복사 후 프로퍼티 삭제
    if (typeof data === 'object') {
      const result = { ...data };
      for (const prop of properties) {
        if (prop in result) {
          delete result[prop];
        }
      }
      return result;
    }

    // 그 외 (primitive) 그대로 반환
    return data;
  }
}
