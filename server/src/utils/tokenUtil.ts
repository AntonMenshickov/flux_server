import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

interface ITokenPayload {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export const tokenUtil = {
  create: (userId: string): ITokenPayload => {
    const secret: string = process.env.JWT_SECRET!;
    const accessToken = jwt.sign({userId}, secret, <SignOptions>{ expiresIn: process.env.JWT_AT_EXPIRES_IN });
    const decodedAccess = jwt.decode(accessToken) as JwtPayload;
    const accessTokenExpiresAt = decodedAccess?.exp ? new Date(decodedAccess.exp * 1000) : null;
    const refreshToken = jwt.sign({userId}, secret, <SignOptions>{ expiresIn: process.env.JWT_RT_EXPIRES_IN });
    const decodedRefresh = jwt.decode(accessToken) as JwtPayload;
    const refreshTokenExpiresAt = decodedRefresh?.exp ? new Date(decodedRefresh.exp * 1000) : null;
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: accessTokenExpiresAt!,
      refreshTokenExpiresAt: refreshTokenExpiresAt!,
    }
  },
  decode: (token: string): JwtPayload => {
    return jwt.decode(token) as JwtPayload;
  },
  verify: (token: string): JwtPayload => {
    const secret: string = process.env.JWT_SECRET!;
    return jwt.verify(token, secret) as JwtPayload;
  }
}