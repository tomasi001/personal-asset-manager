export interface JwtPayload {
  userId: string;
  sub: string;
  privyId: string;
  iat: number;
}
