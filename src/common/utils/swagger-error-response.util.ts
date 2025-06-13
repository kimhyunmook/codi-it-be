// src/common/swagger/error-response.util.ts

export const SwaggerErrorExamples = {
  Unauthorized: {
    statusCode: 401,
    message: '인증이 필요합니다.',
    error: 'Unauthorized',
  },
  Forbidden: {
    statusCode: 403,
    message: '접근 권한이 없습니다.',
    error: 'Forbidden',
  },
  NotFound: {
    statusCode: 404,
    message: '요청한 리소스를 찾을 수 없습니다.',
    error: 'Not Found',
  },
  BadRequest: {
    statusCode: 400,
    message: '잘못된 요청입니다.',
    error: 'Bad Request',
  },
};
