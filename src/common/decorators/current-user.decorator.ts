import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CurrentUser()               → req.user 전체
 * @CurrentUser('sub')          → req.user.sub
 * @CurrentUser('email')        → req.user.email
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    return data ? user?.[data] : user;
  },
);
