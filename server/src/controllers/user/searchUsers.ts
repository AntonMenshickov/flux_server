import { Response, NextFunction } from 'express';
import { IUser, User } from '../../model/mongo/user';
import { responseMessages } from '../../strings/responseMessages';
import { Document } from 'mongoose';
import { AuthRequest } from '../../middleware/authorizationRequired';

export async function searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
  const search = (req.query.search as string || '').trim();
  const limit = Number(req.query.limit) || 20;
  const offset = Number(req.query.offset) || 0;

  if (req.user?.isOwner !== true) {
    return res.status(403).json({ error: responseMessages.FORBIDDEN });
  }

  const query = search ? { login: { $regex: search, $options: 'i' } } : {};
  const usersCount = await User.countDocuments(query).exec();
  const users: (IUser & Document)[] = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .exec();


  return res.status(200).json({
    success: true,
    result: {
      total: usersCount,
      users: users.map(u => ({
        id: u._id.toString(),
        login: u.login,
        isOwner: u.isOwner,
      }))
    }
  });
}