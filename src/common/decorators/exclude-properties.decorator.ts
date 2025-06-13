import { SetMetadata } from '@nestjs/common';

/**
 * 키를 제외할 속성을 지정하는 데코레이터
 * @param properties 제거할 프로퍼티 이름 배열
 */
export const EXCLUDE_PROPERTIES_KEY = 'exclude_properties';
export const ExcludeProperties = (...properties: string[]) =>
  SetMetadata(EXCLUDE_PROPERTIES_KEY, properties);
