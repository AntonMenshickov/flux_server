import jwt, { JsonWebTokenError, JwtPayload, SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { container } from 'tsyringe';
import { ConfigService } from '../services/configService';

interface ITokenPayload {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

export const tokenUtil = {
  createDeviceToken: (applicationId: string): string => {
    const secret: string = container.resolve(ConfigService).jwtSecret;
    const accessToken = jwt.sign({ applicationId }, secret, <SignOptions>{ expiresIn: '100y' });
    return accessToken;
  },
  createUserToken: (userId: string): ITokenPayload => {
    const secret: string = container.resolve(ConfigService).jwtSecret!;
    const accessToken = jwt.sign({ userId }, secret, <SignOptions>{ expiresIn: container.resolve(ConfigService).jwtAtExpiresIn });
    const decodedAccess = jwt.decode(accessToken) as JwtPayload;
    const accessTokenExpiresAt = decodedAccess?.exp ? new Date(decodedAccess.exp * 1000) : null;
    const refreshToken = jwt.sign({ userId }, secret, <SignOptions>{ expiresIn: container.resolve(ConfigService).jwtRtExpiresIn });
    const decodedRefresh = jwt.decode(refreshToken) as JwtPayload;
    const refreshTokenExpiresAt = decodedRefresh?.exp ? new Date(decodedRefresh.exp * 1000) : null;
    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: accessTokenExpiresAt!,
      refreshTokenExpiresAt: refreshTokenExpiresAt!,
    }
  },
  decode: (token: string): JwtPayload & { userId: string } => {
    return jwt.decode(token) as JwtPayload & { userId: string };
  },
  verify: (token: string): JwtPayload & { userId?: string, applicationId?: string } => {
    const secret: string = container.resolve(ConfigService).jwtSecret!;
    return jwt.verify(token, secret) as JwtPayload & { userId: string };
  }
}