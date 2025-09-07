import { Request, Response, NextFunction } from 'express';
import { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { tokenUtil } from '../utils/tokenUtil';
import { responseMessages } from '../strings/responseMessages';
import { IUser, User } from '../model/mongo/user';
import { Document, Types } from 'mongoose';

export interface AuthRequest extends Request {
  user?: IUser;
}

export async function authorizationRequired(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: responseMessages.MISSING_AUTH_HEADER });
  }

  const token = auth.slice(7);

  try {
    const payload = tokenUtil.verify(token) as JwtPayload;
    if (payload instanceof Error) {
      if (payload instanceof TokenExpiredError) {
        return res.status(401).json({ error: responseMessages.TOKEN_EXPIRED });
      } else {
        return res.status(401).json({ error: responseMessages.INVALID_TOKEN });
      }
    }
    const user: IUser & Document | null = await User.findById(payload.userId).exec();
    if (!user) {
      return res.status(401).json({ error: responseMessages.USER_NOT_FOUND });
    }
    req.user = user as IUser;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token', details: (err as Error).message });
  }
}