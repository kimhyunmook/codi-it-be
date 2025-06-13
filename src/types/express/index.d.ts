import { JwtPayload } from 'src/common/interfaces/jwt-payload.interface';

declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}
