import { ApiHeaderOptions } from '@nestjs/swagger';

export const ApiHeaderMsg: ApiHeaderOptions = {
  name: 'Authorization',
  description: 'Bearer <access_token>',
  required: true,
};
