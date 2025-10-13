import { Request, Response, NextFunction } from 'express';
import { IUser, User } from '../../model/mongo/user';
import { responseMessages } from '../../strings/responseMessages';
import { tokenUtil } from '../../utils/tokenUtil';
import { Document } from 'mongoose';
import { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import z from 'zod';

export const refreshValidateSchema = z.object({
  body: z.object({
    refreshToken: z.jwt(),
  })
});

export async function refresh(req: Request, res: Response, next: NextFunction) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: responseMessages.MISSING_REFRESH_TOKEN });
  }
  let tokenData: JwtPayload & { userId?: string };
  try {
    tokenData = tokenUtil.verify(refreshToken) as JwtPayload & { userId?: string };
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return res.status(401).json({ error: responseMessages.TOKEN_EXPIRED });
    }
    return res.status(401).json({ error: responseMessages.INVALID_REFRESH_TOKEN });
  }
  if (!tokenData.userId) {
    return res.status(401).json({ error: responseMessages.INVALID_REFRESH_TOKEN });
  }
  const user: IUser & Document | null = await User.findById(tokenData.userId).exec();

  if (!user) {
    return res.status(404).json({ error: responseMessages.USER_NOT_FOUND });
  }

  const tokens = tokenUtil.createUserToken(user._id.toString());

  return res.status(200).json({
    success: true,
    result: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  });
}