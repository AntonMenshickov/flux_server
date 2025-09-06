import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { tokenUtil } from '../utils/tokenUtil';
import { responseMessages } from '../strings/responseMessages';

export interface AuthRequest extends Request {
  user?: string;
}

export function jwtAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: responseMessages.MISSING_AUTH_HEADER });
  }

  const token = auth.slice(7);

  try {
    const payload = tokenUtil.verify(token) as JwtPayload;
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return res.status(401).json({ error: responseMessages.TOKEN_EXPIRED });
    }
    req.user = payload.userId;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token', details: (err as Error).message });
  }
}
