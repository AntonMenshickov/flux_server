import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/authorizationRequired';

export async function profile(req: AuthRequest, res: Response, next: NextFunction) {

  return res.status(200).json({
    success: true,
    result: {
      id: req.user!._id.toString(),
      login: req.user!.login,
      isOwner: req.user!.isOwner || false,
    }
  });
}