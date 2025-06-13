export interface JwtPayload {
  sub: string; // user id
  email: string; // user email
  type: string; // user type (optional)
}
